import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
export default function EventQueries() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const BACKEND = import.meta.env.VITE_API_URL || "http://";

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    // load history
    const loadHistory = async () => {
      try {
        const res = await axiosInstance.get(
          `/events/${eventId}/queries`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(res.data?.data || []);
      } catch (e) {
        console.error("history fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();

    // socket
    const s = io(BACKEND, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = s;

    s.on("query:new", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => s.disconnect();
  }, [eventId, navigate]);

  const sendMessage = () => {
    if (!text.trim()) return;
    const msg = text;
    setText("");

    socketRef.current.emit(
      "query:send",
      { eventId, message: msg },
      () => {}
    );
  };

  // helper for date label
  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  let lastDate = null;

  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col text-white">

      {/* HEADER */}
      <div className="px-6 py-4 border-b border-white/10 bg-[#0f172a] flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-300 hover:text-white"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-lg font-semibold">Event Support</h2>
          <p className="text-xs text-slate-400">
            Private chat with event organizers
          </p>
        </div>
      </div>

      {/* CHAT BODY */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-slate-400">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.senderRole === "participant";
            const msgDate = formatDate(m.createdAt);
            const showDate = msgDate !== lastDate;
            lastDate = msgDate;

            return (
              <React.Fragment key={m._id}>
                {/* DATE SEPARATOR */}
                {showDate && (
                  <div className="flex justify-center">
                    <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full">
                      {msgDate}
                    </span>
                  </div>
                )}

                {/* MESSAGE */}
                <div
                  className={`flex ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[65%] rounded-xl px-4 py-3 text-sm
                      ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-slate-700 text-white rounded-bl-sm"
                      }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {isMe ? "You" : "Organizer"}
                    </div>
                    <div>{m.message}</div>
                    <div className="text-[10px] opacity-60 mt-1 text-right">
                      {formatTime(m.createdAt)}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="border-t border-white/10 bg-[#0f172a] px-6 py-4 flex gap-3">
        <textarea
          className="flex-1 resize-none bg-[#1e293b] rounded-xl px-4 py-3 text-sm focus:outline-none"
          placeholder="Type your message..."
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 hover:bg-indigo-700 px-6 rounded-xl font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}
