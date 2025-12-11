// src/components/Inbox.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export default function Inbox() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const res = await axios.get("http://localhost:5005/notifications", config);
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Inbox fetch failed");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
        <div className="absolute right-5 top-16 bg-slate-700 border border-slate-600 rounded-lg p-4 w-72 shadow-xl">
          <h3 className="font-semibold mb-2">Inbox</h3>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-slate-400 text-sm">No messages</p>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className="bg-slate-600 p-2 rounded text-sm">
                  {n.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
