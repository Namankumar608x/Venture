// src/components/Inbox.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function Inbox() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
const navigate = useNavigate();
const [menuOpen, setMenuOpen] = useState(false);

const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  navigate("/login");
};

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
    <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700 relative z-40">

  <h1 className="text-xl font-bold text-white cursor-pointer"
      onClick={() => navigate("/")}>
    VENTURA
  </h1>

  <div className="flex items-center gap-4 relative">

    {/* 🔔 NOTIFICATION BELL */}
    <button
      onClick={() => setOpen(true)}
      className="relative text-xl text-white"
    >
      🔔
      {notifications.length > 0 && (
        <span className="absolute -top-1 -right-2 bg-red-600 text-xs px-2 rounded-full">
          {notifications.length}
        </span>
      )}
    </button>

    {/* 👤 PROFILE ICON */}
    <button
      onClick={() => setMenuOpen(!menuOpen)}
      className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-sm"
    >
      👤
    </button>

    {/* PROFILE DROPDOWN */}
    {menuOpen && (
      <div className="absolute right-0 top-12 bg-slate-700 rounded-lg shadow-xl w-40 text-sm z-50">
        <button
          onClick={() => {
            setMenuOpen(false);
            navigate("/profile");
          }}
          className="block w-full text-left px-4 py-2 hover:bg-slate-600"
        >
          View Profile
        </button>

        <button
          onClick={logout}
          className="block w-full text-left px-4 py-2 hover:bg-slate-600 text-red-400"
        >
          Logout
        </button>
      </div>
    )}
  </div>
</div>

      
    </>
  );
}
