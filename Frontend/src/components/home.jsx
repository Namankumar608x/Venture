import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";

export default function Home() {
  const navigate = useNavigate();
  const [adminTournaments, setAdminTournaments] = useState([]);
  const [participantTournaments, setParticipantTournaments] = useState([]);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [joinTournamentId, setJoinTournamentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("admin"); // 'admin' or 'joined'

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const [adminRes, participantRes] = await Promise.all([
        axiosInstance.get("/clubs/my-admin"),
        axiosInstance.get("/clubs/participant"),
      ]);
      setAdminTournaments(adminRes.data.tournaments || []);
      setParticipantTournaments(participantRes.data.tournaments || []);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTournamentName.trim()) return;
    try {
      await axiosInstance.post("/clubs/new", { name: newTournamentName.trim() });
      setNewTournamentName("");
      fetchTournaments();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create");
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinTournamentId.trim()) return;
    try {
      await axiosInstance.post("/clubs/join", { clubId: joinTournamentId.trim() });
      setJoinTournamentId("");
      fetchTournaments();
      setActiveTab("joined");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to join");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 p-8 md:p-12 border border-indigo-500/20 shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Venture</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-xl">
            Manage your sports clubs, organize tournaments, and track live scores seamlessly.
          </p>
        </div>
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* ACTION GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* CREATE CARD */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <i className="fa-solid fa-plus text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Club</h2>
              <p className="text-sm text-slate-400">Start a new tournament group</p>
            </div>
          </div>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              value={newTournamentName}
              onChange={(e) => setNewTournamentName(e.target.value)}
              placeholder="Enter club name..."
              className="input-field"
            />
            <button className="btn-primary whitespace-nowrap">
              Create
            </button>
          </form>
        </div>

        {/* JOIN CARD */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <i className="fa-solid fa-users text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Join Club</h2>
              <p className="text-sm text-slate-400">Enter an ID to join an existing group</p>
            </div>
          </div>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              value={joinTournamentId}
              onChange={(e) => setJoinTournamentId(e.target.value)}
              placeholder="Paste Club ID..."
              className="input-field"
            />
            <button className="btn-secondary whitespace-nowrap">
              Join
            </button>
          </form>
        </div>
      </div>

      {/* TOURNAMENTS LIST */}
      <div>
        <div className="flex items-center gap-6 border-b border-slate-700 mb-6">
          <button
            onClick={() => setActiveTab("admin")}
            className={`pb-3 px-2 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "admin"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            My Clubs (Admin)
          </button>
          <button
            onClick={() => setActiveTab("joined")}
            className={`pb-3 px-2 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "joined"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Joined Clubs
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading tournaments...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(activeTab === "admin" ? adminTournaments : participantTournaments).length === 0 ? (
              <div className="col-span-full p-8 text-center bg-slate-800/50 rounded-2xl border border-dashed border-slate-700 text-slate-400">
                No clubs found in this category.
              </div>
            ) : (
              (activeTab === "admin" ? adminTournaments : participantTournaments).map((t) => (
                <div
                  key={t._id}
                  onClick={() => navigate(`/events/${t._id}`)}
                  className="group bg-slate-800 border border-slate-700 p-5 rounded-2xl hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-lg font-bold text-white group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-900 px-2 py-1 rounded">
                      {activeTab === "admin" ? "ADMIN" : "MEMBER"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                    {t.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono truncate">ID: {t._id}</p>
                  
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}