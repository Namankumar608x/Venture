// src/components/AdminEventQueries.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
export default function AdminEventQueries() {
  const { clubid, eventId } = useParams();
  const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://";

  const [threads, setThreads] = useState({}); // { userId: { messages: [], user: {...}, unread: 0 } }
  const [participantsOrder, setParticipantsOrder] = useState([]); // ordered participant ids
  const [selectedUser, setSelectedUser] = useState(null); // participantId selected for conversation
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const log = (...args) => console.log("[AdminEventQueries]", ...args);

  // dedupe helper
  const addMessageToThread = (msg) => {
    const uid = msg.targetUser
      ? String(msg.targetUser)
      : (msg.sender?._id ? String(msg.sender._id) : String(msg.sender));
    // For participant messages, uid should equal sender id
    // For admin replies uid === targetUser
    setThreads((prev) => {
      const copy = { ...prev };
      if (!copy[uid]) copy[uid] = { messages: [], user: msg.sender || null, unread: 0 };
      // avoid duplicates
      if (!copy[uid].messages.some(m => String(m._id) === String(msg._id))) {
        copy[uid].messages = [...copy[uid].messages, msg].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
        // increment unread if not selected
        if (selectedUser !== uid) copy[uid].unread = (copy[uid].unread || 0) + 1;
      }
      return copy;
    });
    setParticipantsOrder(prev => {
      if (!prev.includes(uid)) return [uid, ...prev];
      // move to front
      return [uid, ...prev.filter(x => x !== uid)];
    });
  };

  useEffect(() => {
    log("mount -> clubid:", clubid, "eventId:", eventId, "BACKEND:", BACKEND);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.warn("[AdminEventQueries] no token");
      return;
    }

    // load all queries (admin sees all)
    const loadAllQueries = async () => {
      try {
        log("GET", `${BACKEND}/events/${eventId}/queries`);
        const res = await axiosInstance.get(`${BACKEND}/events/${eventId}/queries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        log("GET queries response:", res?.data);
        const items = Array.isArray(res?.data?.data) ? res.data.data : [];
        // group by participant (sender if participant) or targetUser (admin replies)
        const grouped = {};
        const order = [];
        items.forEach((m) => {
          // determine thread owner: participant id
          let participantId = null;
          if (m.senderRole === "participant") participantId = (m.sender?._id) ? String(m.sender._id) : String(m.sender);
          else if (m.targetUser) participantId = String(m.targetUser);
          else participantId = (m.sender?._id) ? String(m.sender._id) : String(m.sender);

          if (!grouped[participantId]) grouped[participantId] = { messages: [], user: m.sender || null, unread: 0 };
          // avoid duplicates
          if (!grouped[participantId].messages.some(x => String(x._id) === String(m._id))) grouped[participantId].messages.push(m);
          if (!order.includes(participantId)) order.push(participantId);
        });
        // sort messages
        Object.keys(grouped).forEach(k => {
          grouped[k].messages.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
        });

        setThreads(grouped);
        setParticipantsOrder(order.reverse()); // latest at top
      } catch (err) {
        console.error("[AdminEventQueries] loadAllQueries error:", err?.response || err);
      } finally {
        setLoading(false);
      }
    };
    loadAllQueries();

    // socket connect
    try {
      log("Initializing socket.io client to", BACKEND);
      const s = io(BACKEND, { auth: { token }, transports: ["websocket"], path: "/socket.io" });
      socketRef.current = s;

      s.on("connect", () => {
        log("Socket connected", s.id);
        // ensure admin joins organizer room for this event
        s.emit("join:organizer", { eventId }, (ack) => {
          log("join:organizer ack:", ack);
        });
      });

      s.on("query:new", (msg) => {
        log("socket -> query:new", msg);
        // add to correct thread
        addMessageToThread(msg);
      });

      s.on("connect_error", (err) => {
        console.error("[AdminEventQueries] socket connect_error:", err);
      });

      s.on("disconnect", (reason) => {
        console.warn("[AdminEventQueries] socket disconnected:", reason);
      });
    } catch (err) {
      console.error("[AdminEventQueries] socket init failed:", err);
    }

    return () => {
      log("cleanup -> disconnect socket");
      if (socketRef.current) {
        try {
          socketRef.current.emit("leave:event", { eventId }, (ack) => log("leave:event ack:", ack));
        } catch (e) { log("leave:event error", e); }
        try { socketRef.current.disconnect(); } catch(e){ log("socket disconnect error", e); }
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubid, eventId]);

  // select a participant to open conversation
  const selectParticipant = (participantId) => {
    setSelectedUser(participantId);
    // clear unread
    setThreads(prev => {
      const copy = { ...prev };
      if (copy[participantId]) copy[participantId].unread = 0;
      return copy;
    });
  };

  const sendReply = async () => {
    if (!replyText?.trim() || !selectedUser) return;
    const token = localStorage.getItem("accessToken");
    if (!token) { console.warn("no token"); return; }

    // prefer socket emit
    const s = socketRef.current;
    if (s && s.connected) {
      log("Emitting admin reply via socket to targetUser:", selectedUser, "message:", replyText);
      s.emit("query:send", { eventId, message: replyText, targetUser: selectedUser }, (ack) => {
        log("reply ack:", ack);
        if (ack?.success && ack?.data) {
          // append to thread safely
          addMessageToThread(ack.data);
          setReplyText("");
        }
      });
    } else {
      // fallback to REST create (POST)
      try {
        log("Socket not connected - POST fallback", `${BACKEND}/events/${eventId}/queries`);
        const res = await axiosInstance.post(
          `${BACKEND}/events/${eventId}/queries`,
          { message: replyText, targetUser: selectedUser },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        log("reply POST res:", res?.data);
        if (res?.data?.data) {
          addMessageToThread(res.data.data);
          setReplyText("");
        }
      } catch (err) {
        console.error("[AdminEventQueries] reply POST failed:", err?.response || err);
      }
    }
  };

  // UI render helpers
  const renderInbox = () => {
    if (loading) return <div style={{ padding: 12 }}>Loading...</div>;
    if (participantsOrder.length === 0) return <div style={{ padding: 12 }}>No queries yet.</div>;

    return participantsOrder.map((pid) => {
      const t = threads[pid] || { messages: [], user: null, unread: 0 };
      const last = t.messages[t.messages.length - 1];
      const displayName = (t.user && (t.user.username || t.user.name)) || `User ${pid.slice(0,6)}`;
      return (
        <div
          key={pid}
          onClick={() => selectParticipant(pid)}
          style={{
            padding: 10,
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            cursor: "pointer",
            background: selectedUser === pid ? "rgba(255,255,255,0.04)" : "transparent"
          }}
        >
          <div style={{ fontWeight: 700 }}>{displayName}</div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {last ? last.message : "—"}
          </div>
          {t.unread ? <div style={{ float: "right", background: "#ff4d4f", color: "#fff", padding: "2px 6px", borderRadius: 12, fontSize: 12 }}>{t.unread}</div> : null}
        </div>
      );
    });
  };

  const renderConversation = () => {
    if (!selectedUser) {
      return <div style={{ padding: 20, color: "#aaa" }}>Select a participant to view conversation.</div>;
    }
    const t = threads[selectedUser] || { messages: [], user: null, unread: 0 };
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <strong>{(t.user && (t.user.username || t.user.name)) || `User ${selectedUser.slice(0,6)}`}</strong>
          <div style={{ fontSize: 12, color: "#888" }}>Participant ID: {selectedUser}</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {t.messages.length === 0 ? <div style={{ color: "#999" }}>No messages yet.</div> : t.messages.map(m => (
            <div key={m._id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#666" }}>
                <strong>{m.sender?.username || m.sender?.name || (m.senderRole || "system")}</strong>
                <span style={{ marginLeft: 8, color: "#999", fontSize: 12 }}>{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <div style={{
                marginTop: 6,
                padding: 10,
                borderRadius: 8,
                background: m.senderRole === "participant" ? "#fff" : "rgba(255,255,255,0.06)",
                color: m.senderRole === "participant" ? "#000" : "#fff",
                display: "inline-block",
                maxWidth: "80%"
              }}>
                {m.message}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 8 }}>
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type reply to participant..." style={{ flex: 1, padding: 8, borderRadius: 6 }} rows={3}/>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button onClick={sendReply} disabled={!replyText.trim()}>Send</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: 12, padding: 16, height: "80vh" }}>
      <div style={{ width: 280, borderRadius: 8, background: "#0f1724", color: "#fff", overflowY: "auto" }}>
        <div style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.04)", fontWeight: 700 }}>Participant Queries</div>
        {renderInbox()}
      </div>

      <div style={{ flex: 1, borderRadius: 8, background: "#071122", color: "#fff", display: "flex", flexDirection: "column" }}>
        {renderConversation()}
      </div>
    </div>
  );
}
