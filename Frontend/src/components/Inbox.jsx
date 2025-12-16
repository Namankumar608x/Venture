import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
export default function Inbox() {
  const [notifications, setNotifications] = useState([]);
  const [showInbox, setShowInbox] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    console.log("logout called");
   localStorage.clear();

  // 2️⃣ REMOVE auth header from axios instance
  delete api.defaults.headers.common["Authorization"];

  // 3️⃣ Navigate & replace history
  navigate("/", { replace: true });
  };

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

  const approveRequest = async (notificationId) => {
    await api.post("/teams/team/accept-request", { notificationId });
    fetchNotifications();
  };

  const rejectRequest = async (notificationId) => {
    await api.post("/teams/team/reject-request", { notificationId });
    fetchNotifications();
  };

  // Close menus when clicking outside (simple implementation)
  useEffect(() => {
    const handleClick = () => {
      setShowProfileMenu(false);
      setShowInbox(false);
    };
    // Add event listener to body content if needed, 
    // but for now relying on direct toggles is safer for iFrame environments.
  }, []);

  return (
    <>
      <nav className="glass-panel border-b-0 rounded-b-2xl mx-4 mt-2 px-6 py-3 flex items-center justify-between shadow-xl shadow-black/20">
        {/* LOGO */}
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => navigate("/home")}
        >
         
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            VENTURE
          </h1>
          
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-6">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInbox(!showInbox);
                setShowProfileMenu(false);
              }}
              className={`text-2xl transition-colors ${showInbox ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
            >
              <i className="fa-solid fa-bell"></i>
            </button>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-2 w-5 h-5 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-[#0f172a]">
                {notifications.length}
              </span>
            )}

            {/* NOTIFICATION DROPDOWN */}
            {showInbox && (
              <div 
                className="absolute right-0 top-12 w-80 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                  <span className="font-semibold text-sm">Notifications</span>
                  <button onClick={() => fetchNotifications()} className="text-xs text-indigo-400 hover:text-indigo-300">Refresh</button>
                </div>
                
                <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      <i className="fa-regular fa-envelope-open mb-2 text-xl block"></i>
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((note) => (
                      <div key={note.id} className="bg-slate-700/30 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                        <p className="text-sm text-slate-200 mb-3 leading-relaxed">{note.message}</p>
                        {note.requser && note.teamid && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveRequest(note.id)}
                              className="flex-1 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded text-xs font-medium transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => rejectRequest(note.id)}
                              className="flex-1 py-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded text-xs font-medium transition-colors"
                            >
                              Decline
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

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
                setShowInbox(false);
              }}
              className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 hover:border-indigo-500 flex items-center justify-center transition-all overflow-hidden"
            >
              <i className="fa-solid fa-user text-slate-400"></i>
            </button>

            {/* PROFILE DROPDOWN */}
            {showProfileMenu && (
              <div
  className="absolute right-0 top-12 w-48 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 py-1"
  onClick={(e) => e.stopPropagation()}
>
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
                >
                  <i className="fa-regular fa-id-card opacity-70"></i> Profile
                </button>
                <div className="h-px bg-slate-700 my-1 mx-2"></div>
                <button
                 onClick={() => {
    console.log("logout called");
    localStorage.clear();
    navigate("/", { replace: true });
  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-900/20 transition-colors flex items-center gap-2"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Backdrop for mobile overlays */}
     
       
    </>
  );
}