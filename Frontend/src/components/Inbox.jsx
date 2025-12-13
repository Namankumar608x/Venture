// src/components/Inbox.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";

export default function Inbox() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  /* ----------------------------------
      FETCH NOTIFICATIONS
  ----------------------------------- */
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/teams/team/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Inbox fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  /* ----------------------------------
      LOCK BODY SCROLL
  ----------------------------------- */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [open]);

  /* ----------------------------------
      ACTIONS
  ----------------------------------- */
  const approveRequest = async (notificationId) => {
    try {
      await api.post("/teams/team/accept-request", { notificationId });
      fetchNotifications();
    } catch (err) {
      console.error("Approve failed:", err.response?.data);
    }
  };

  const rejectRequest = async (notificationId) => {
    try {
      await api.post("/teams/team/reject-request", { notificationId });
      fetchNotifications();
    } catch (err) {
      console.error("Reject failed:", err.response?.data);
    }
  };

  return (
    <>
      {/* TOP BAR */}
      <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700 relative z-40">
        <h1 className="text-xl font-bold text-white">VENTURA</h1>

        <button
          onClick={() => setOpen(true)}
          className="relative text-xl px-3 text-white"
        >
          🔔
          {notifications.length > 0 && (
            <span className="absolute -top-1 right-0 bg-red-600 text-xs px-2 rounded-full">
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {/* =======================
           FULL SCREEN OVERLAY
      ======================== */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />

          {/* MODAL */}
          <div className="relative bg-slate-800 w-full max-w-md max-h-[80vh] rounded-xl shadow-2xl p-5 overflow-y-auto z-[10000]">
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Inbox</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-white text-xl"
              >
                ✕
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="text-slate-400 text-sm">No notifications</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((note) => (
                  <div
                    key={note.id}
                    className="bg-slate-700 p-3 rounded text-sm text-white flex flex-col gap-2"
                  >
                    <p>{note.message}</p>

                    {note.requser && note.teamid && (
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-emerald-600 rounded text-xs"
                          onClick={() => approveRequest(note.id)}
                        >
                          Accept
                        </button>

                        <button
                          className="px-3 py-1 bg-red-600 rounded text-xs"
                          onClick={() => rejectRequest(note.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
