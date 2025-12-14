import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function Inbox() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  /* ----------------------------------
      LOGOUT
  ----------------------------------- */
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
      LOCK BODY SCROLL (Inbox modal)
  ----------------------------------- */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [open]);

  /* ----------------------------------
      ACTIONS
  ----------------------------------- */
  const approveRequest = async (notificationId) => {
    await api.post("/teams/team/accept-request", { notificationId });
    fetchNotifications();
  };

  const rejectRequest = async (notificationId) => {
    await api.post("/teams/team/reject-request", { notificationId });
    fetchNotifications();
  };

  return (
    <>
      {/* ================= TOP BAR ================= */}
      <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700 relative z-40">
        <h1
          className="text-xl font-bold text-white cursor-pointer"
          onClick={() => navigate("/")}
        >
          VENTURA
        </h1>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-4 relative">
          {/* 🔔 Inbox */}
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

          {/* 👤 Profile */}
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

      {/* ================= INBOX MODAL ================= */}
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
