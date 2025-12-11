// src/components/Inbox.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Inbox() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const getConfig = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchNotifications = async () => {
    try {
      const config = getConfig();
      if (!config) return;

      const res = await axios.get(
        "http://localhost:5005/teams/team/notifications",
        config
      );

      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Inbox fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ---------------------------
  // APPROVE REQUEST
  // ---------------------------
  const approveRequest = async (notificationId) => {
    try {
      const config = getConfig();

      await axios.post(
        "http://localhost:5005/teams/team/approve-request",
        { notificationId },
        config
      );

      // Refresh inbox
      fetchNotifications();
    } catch (err) {
      console.error("Approve failed:", err.response?.data);
    }
  };

  // ---------------------------
  // REJECT REQUEST
  // ---------------------------
  const rejectRequest = async (notificationId) => {
    try {
      const config = getConfig();

      await axios.post(
        "http://localhost:5005/teams/team/reject-request",
        { notificationId },
        config
      );

      fetchNotifications();
    } catch (err) {
      console.error("Reject failed:", err.response?.data);
    }
  };

  return (
    <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700">
      
      <h1 className="text-xl font-bold">VENTURA</h1>

      {/* Notification Bell */}
      <button onClick={() => setOpen(!open)} className="relative text-xl px-3">
        🔔
        {notifications.length > 0 && (
          <span className="absolute -top-1 right-0 bg-red-600 text-xs px-2 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-5 top-16 bg-slate-700 border border-slate-600 rounded-lg p-4 w-80 shadow-xl">
          <h3 className="font-semibold mb-2">Inbox</h3>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-slate-400 text-sm">No notifications</p>
            ) : (
              notifications.map((note) => (
                <div
                  key={note.id}
                  className="bg-slate-600 p-3 rounded text-sm flex flex-col gap-2"
                >
                  {/* MESSAGE */}
                  <p>{note.message}</p>

                  {/* If it contains a team join request */}
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
