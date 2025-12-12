// src/components/EventQueries.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";

export default function EventQueries() {
  const { clubid, eventId } = useParams();
  const navigate = useNavigate();

  const [queries, setQueries] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);

  // debug helper
  const log = (...args) => console.log("[EventQueries]", ...args);

  useEffect(() => {
    log("mount -> clubid:", clubid, "eventId:", eventId);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.warn("[EventQueries] no accessToken found, redirecting to /login");
      navigate("/login");
      return;
    }

    // fetch history
    async function loadHistory() {
      try {
        log("Fetching /events/:eventId/queries");
        const res = await axios.get(`/events/${eventId}/queries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        log("History response:", res?.data);
        setQueries(Array.isArray(res?.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error("[EventQueries] failed to fetch queries:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();

    // connect socket
    try {
      log("Initializing socket.io client");
      const s = io("/", {
        auth: { token },
        transports: ["websocket"],
        path: "/socket.io",
      });
      socketRef.current = s;

      s.on("connect", () => {
        log("Socket connected", s.id);
        // quick ping to ensure server knows this client
        s.emit("ping:test", (resp) => {
          log("ping:test ack:", resp);
        });

        // join event room if server expects it (some servers use join:event)
        // This is safe: server will ack or ignore.
        s.emit("join:event", { eventId }, (ack) => {
          log("join:event ack:", ack);
        });
      });

      s.on("connect_error", (err) => {
        console.error("[EventQueries] socket connect_error:", err);
      });

      s.on("query:new", (msg) => {
        log("Received query:new:", msg);
        setQueries((prev) => [...prev, msg]);
      });

      // also listen generic chat events for safety
      s.on("chat:new", (msg) => {
        log("Received chat:new (ignored for queries):", msg);
      });

      s.on("disconnect", (reason) => {
        console.warn("[EventQueries] socket disconnected:", reason);
      });
    } catch (err) {
      console.error("[EventQueries] socket init failed:", err);
    }

    return () => {
      log("cleanup -> disconnecting socket");
      if (socketRef.current) {
        try {
          socketRef.current.emit("leave:event", { eventId }, (ack) => {
            log("leave:event ack:", ack);
          });
        } catch (e) {
          log("leave:event error:", e);
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [clubid, eventId, navigate]);

  const handleSend = async () => {
    if (!text?.trim()) {
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.warn("[EventQueries] no token, cannot send");
      return;
    }

    setSending(true);

    // First try socket emit with ack
    const s = socketRef.current;
    if (s && s.connected) {
      log("Emitting query:send via socket", { eventId, message: text });
      s.emit("query:send", { eventId, message: text }, (ack) => {
        log("query:send ack:", ack);
        if (ack?.success && ack?.data) {
          setQueries((prev) => [...prev, ack.data]);
          setText("");
        } else {
          console.error("[EventQueries] query:send failed ack:", ack);
          // fallback: try REST POST if you later implement it on backend
        }
        setSending(false);
      });
    } else {
      // fallback to REST (if your backend provides POST /events/:eventId/queries)
      try {
        log("Socket not connected - falling back to REST POST");
        const res = await axios.post(
          `/events/${eventId}/queries`,
          { message: text },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        log("POST /events/:eventId/queries res:", res?.data);
        if (res?.data?.data) {
          setQueries((prev) => [...prev, res.data.data]);
          setText("");
        }
      } catch (err) {
        console.error("[EventQueries] REST POST fallback failed:", err);
      } finally {
        setSending(false);
      }
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Event Queries (private)</h2>
      <p style={{ color: "#666", marginTop: 4 }}>
        Queries you raise here are private (visible only to you & event organizers).
      </p>

      <div style={{ marginTop: 16, marginBottom: 12 }}>
        <button onClick={() => navigate(-1)}>← Back</button>
        <span style={{ marginLeft: 12, color: "#333" }}>
          club: {clubid} | event: {eventId}
        </span>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          minHeight: 260,
          maxHeight: 420,
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        {loading ? (
          <div>Loading queries…</div>
        ) : queries.length === 0 ? (
          <div style={{ color: "#666" }}>No queries yet. Ask a question below.</div>
        ) : (
          queries.map((q) => (
            <div
              key={q._id || q.id || `${q.sender?._id}-${q.createdAt}`}
              style={{
                padding: 8,
                marginBottom: 8,
                borderRadius: 6,
                background: q.sender?.username ? "#fff" : "#fff",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: 13, color: "#222", fontWeight: 600 }}>
                {q.sender?.username || q.sender?.name || (q.senderRole || "system")}
                <span style={{ marginLeft: 8, fontSize: 12, color: "#888", fontWeight: 400 }}>
                  {new Date(q.createdAt).toLocaleString()}
                </span>
              </div>
              <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{q.message || q.text}</div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <textarea
          placeholder="Type your private query to the organizers..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={{ width: "100%", padding: 8, borderRadius: 6 }}
        />
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button onClick={handleSend} disabled={sending || !text.trim()}>
            {sending ? "Sending…" : "Send Query"}
          </button>
          <button
            onClick={() => {
              setText("");
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
