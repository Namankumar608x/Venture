import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {jwtDecode} from "jwt-decode";

export default function ClubChat({ clubId, token: propToken }) {
  console.log("🔥 ClubChat mounted", { clubId, propToken });

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const listRef = useRef(null);

  const token = propToken || localStorage.getItem("accessToken");

  console.log("📌 Token & LocalStorage at start:", {
    token,
    localStorageUser: localStorage.getItem("user"),
    localStorageAccessToken: localStorage.getItem("accessToken"),
    localStorageRefresh: localStorage.getItem("refreshToken"),
  });

  const getCurrentUser = () => {
    try {
      const userJson = localStorage.getItem("user");
      console.log("getCurrentUser -> raw localStorage user:", userJson);
      if (userJson) {
        const parsed = JSON.parse(userJson);
        console.log("getCurrentUser -> parsed localStorage user:", parsed);
        if (parsed && (parsed._id || parsed.id)) {
          return { _id: parsed._id || parsed.id, ...parsed };
        }
      }
    } catch (e) {
      console.error("🔴 getCurrentUser JSON parse error:", e);
    }

    if (token) {
      try {
        const payload = jwtDecode(token);
        console.log("getCurrentUser -> JWT decoded:", payload);
        const id = payload.id || payload._id || payload.sub;
        if (id) return { _id: id, ...payload };
      } catch (e) {
        console.error("🔴 getCurrentUser JWT decode error:", e);
      }
    }

    return null;
  };

  const currentUser = getCurrentUser();
  console.log("👤 currentUser result:", currentUser);

  useEffect(() => {
    console.log("🔁 ClubChat useEffect fired", { clubId, token });

    if (!clubId) {
      console.warn("⚠ ClubChat useEffect: no clubId provided");
      setLoading(false);
      return;
    }

    if (!token) {
      console.warn("⚠ ClubChat useEffect: no auth token");
      setError("Not authenticated — please login.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchInitial() {
      console.log("📡 fetchInitial started");
      setLoading(true);

      try {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("📌 Axios auth header set:", axios.defaults.headers.common["Authorization"]);

        // =====================
        // Fetch chat history
        // =====================
        const chatRes = await axios.get(`http://localhost:5005/clubs/${clubId}/chat`);
        console.log("📨 GET /clubs/:clubId/chat response:", chatRes.status, chatRes.data);

        if (!cancelled) {
          setMessages(Array.isArray(chatRes.data?.data) ? chatRes.data.data : []);
        }

        // =====================
        // Fetch club info
        // =====================
        const clubRes = await axios.get(`http://localhost:5005/clubs/${clubId}`);
        console.log("📨 GET /clubs/:clubId response:", clubRes.status, clubRes.data);

        const club = clubRes.data?.club ?? clubRes.data;
        console.log("🏷 Normalized club object:", club);

        // =====================
        // Resolve adminId
        // =====================
        let adminId = null;
        if (club?.admin) {
          if (typeof club.admin === "string") {
            adminId = club.admin;
          } else if (club.admin._id) {
            adminId = club.admin._id;
          } else if (Array.isArray(club.admin) && club.admin.length > 0) {
            adminId = club.admin[0]?._id ?? club.admin[0] ?? null;
          }
        }
        console.log("🔑 adminId resolved:", adminId);

        const userId = currentUser?._id ?? null;
        console.log("🆔 userId resolved:", userId);

        const adminMatch = userId && adminId && userId.toString() === adminId.toString();
        console.log("✅ Admin match result:", adminMatch);

        setIsAdmin(adminMatch);
        setLoading(false);
      } catch (err) {
        console.error("❌ fetchInitial error:", err);
        setError(err.response?.data?.error || err.message || "Failed to load chat");
        setLoading(false);
        setIsAdmin(false);
      }
    }

    fetchInitial();

    // =====================
    // Socket setup
    // =====================
    try {
      console.log("💬 Initializing socket connection...");
      const s = io("http://localhost:5005", { auth: { token } });
      socketRef.current = s;

      s.on("connect", () => {
        console.log("🔗 socket connected, id =", s.id);
        s.emit("join:club", { clubId }, (ack) => {
          console.log("📡 join:club ack:", ack);
        });
      });

      s.on("chat:new:club", (m) => {
        console.log("📥 socket event chat:new:club:", m);
        setMessages((prev) => [...prev, m]);
        setTimeout(() => {
          if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
        }, 50);
      });

      s.on("connect_error", (err) => {
        console.error("⚠ socket connect_error:", err);
      });

      s.on("error", (err) => {
        console.error("⚠ socket error:", err);
      });
    } catch (e) {
      console.error("🔴 socket setup failed:", e);
    }

    return () => {
      console.log("🧹 ClubChat cleanup");
      cancelled = true;
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("leave:club", { clubId });
        socketRef.current.disconnect();
      }
      socketRef.current = null;
    };
  }, [clubId, token]);

  const sendMessage = async () => {
  if (!text.trim()) return;
  setSending(true);
  setError(null);

  const payload = { clubId, message: text.trim() };

  try {
    await new Promise((resolve, reject) => {
      const s = socketRef.current;
      if (!s || !s.connected) return reject(new Error("Socket not connected"));
      s.emit("chat:send:club", payload, (ack) => {
        if (ack?.success) {
          console.log("chat:send:club ack:", ack);
          
          // ❗ Add this
          if (ack.data) {
            setMessages((prev) => {
              // prevent duplicates
              if (prev.some((m) => m._id === ack.data._id)) return prev;
              return [...prev, ack.data];
            });
          }

          setText("");
          resolve(ack.data);
        } else {
          reject(new Error(ack?.error || "send failed"));
        }
      });
    });
  } catch (sockErr) {
    // fallback: REST
    try {
      const postRes = await axios.post(`http://localhost:5005/clubs/${clubId}/chat`, {
        message: text.trim(),
      });
      const newMsg = postRes.data?.data;
      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
      setText("");
    } catch (restErr) {
      setError(restErr.response?.data?.error || restErr.message || "Send failed");
    }
  } finally {
    setSending(false);
  }
};

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-slate-900/60 rounded-2xl p-4 shadow-lg border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Club Announcements</h3>
          <div className="text-sm text-slate-400">
            Room: <span className="font-mono text-xs">club:{clubId}</span>
          </div>
        </div>

        <div
          ref={listRef}
          className="h-64 overflow-auto rounded-md border border-slate-800 p-3 bg-slate-900/30"
        >
          {loading ? (
            <div className="text-slate-400 text-center py-6">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-slate-500 text-center py-6">No announcements yet.</div>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li key={m._id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-white">
                      {m.sender?.username || m.sender?.name || "Admin"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(m.createdAt || Date.now()).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-slate-200">{m.message || m.text}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4">
          {error && <div className="text-sm text-red-400 mb-2">{error}</div>}
          <div className="flex items-start gap-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              disabled={!isAdmin}
              placeholder={isAdmin ? "Write announcement…" : "Only club admins can post announcements"}
              className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 resize-none focus:outline-none"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={sendMessage}
                disabled={!isAdmin || sending}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  isAdmin
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed"
                }`}
              >
                {sending ? "Sending…" : "Send"}
              </button>

              <button
                onClick={() => setText("")}
                className="px-3 py-2 rounded-lg bg-slate-700 text-slate-300"
              >
                Clear
              </button>
            </div>
          </div>

          {!isAdmin && (
            <div className="text-xs text-slate-400 mt-2">
              If you are an admin but cannot post, make sure you are logged in and part of this club.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
