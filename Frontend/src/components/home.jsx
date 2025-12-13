import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";

function Home() {
  const navigate = useNavigate();

  const [adminTournaments, setAdminTournaments] = useState([]);
  const [participantTournaments, setParticipantTournaments] = useState([]);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [joinTournamentId, setJoinTournamentId] = useState("");
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const access = localStorage.getItem("accessToken");
    const refresh = localStorage.getItem("refreshToken");

    if (!access && !refresh) {
      navigate("/");
    }
  }, [navigate]);

  /* ---------------- FETCH TOURNAMENTS ---------------- */

  const fetchTournaments = async () => {
    try {
      setMessage("");

      const [adminRes, participantRes] = await Promise.all([
        axiosInstance.get("/clubs/my-admin"),
        axiosInstance.get("/clubs/participant"),
      ]);

      setAdminTournaments(adminRes.data.tournaments || []);
      setParticipantTournaments(participantRes.data.tournaments || []);
    } catch (err) {
      console.error("[fetchTournaments]", err);
      setMessage("Failed to load tournaments");
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  /* ---------------- CREATE TOURNAMENT ---------------- */

  const handleCreateTournament = async (e) => {
    e.preventDefault();

    if (!newTournamentName.trim()) {
      setMessage("Tournament name is required");
      return;
    }

    setIsCreating(true);
    setMessage("");

    try {
      await axiosInstance.post("/clubs/new", {
        name: newTournamentName.trim(),
      });

      setNewTournamentName("");
      setMessage("Tournament created successfully");
      fetchTournaments();
    } catch (err) {
      console.error("[createTournament]", err);
      setMessage("Failed to create tournament");
    } finally {
      setIsCreating(false);
    }
  };

  /* ---------------- JOIN TOURNAMENT ---------------- */

  const handleJoinTournament = async (e) => {
    e.preventDefault();

    if (!joinTournamentId.trim()) {
      setMessage("Tournament ID is required");
      return;
    }

    setIsJoining(true);
    setMessage("");

    try {
      await axiosInstance.post("/clubs/join", {
        clubId: joinTournamentId.trim(),
      });

      setJoinTournamentId("");
      setMessage("Joined tournament successfully");
      fetchTournaments();
    } catch (err) {
      console.error("[joinTournament]", err);
      setMessage("Failed to join tournament");
    } finally {
      setIsJoining(false);
    }
  };

  /* ---------------- LOGOUT ---------------- */

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  /* ============================ UI ============================ */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Ven<span className="text-blue-500">ture</span> Dashboard
            </h1>
            <p className="text-slate-400 text-sm">
              Create or join tournaments
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
          >
            Logout
          </button>
        </div>

        {/* MAIN CARD */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6">

          <div className="grid md:grid-cols-2 gap-8">
            {/* CREATE */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">
                Create Tournament
              </h2>

              <form onSubmit={handleCreateTournament} className="space-y-3">
                <input
                  value={newTournamentName}
                  onChange={(e) => setNewTournamentName(e.target.value)}
                  placeholder="Tournament name"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
                <button
                  disabled={isCreating}
                  className="w-full py-2 bg-blue-600 rounded-lg text-white"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </form>
            </div>

            {/* JOIN */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">
                Join Tournament
              </h2>

              <form onSubmit={handleJoinTournament} className="space-y-3">
                <input
                  value={joinTournamentId}
                  onChange={(e) => setJoinTournamentId(e.target.value)}
                  placeholder="Tournament ID"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
                <button
                  disabled={isJoining}
                  className="w-full py-2 bg-slate-700 rounded-lg text-white"
                >
                  {isJoining ? "Joining..." : "Join"}
                </button>
              </form>
            </div>
          </div>

          {/* MESSAGE */}
          {message && (
            <div className="mt-6 p-3 bg-slate-800 border border-slate-700 rounded text-center text-white">
              {message}
            </div>
          )}

          {/* LISTS */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {/* ADMIN */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Your Tournaments (Admin)
              </h3>

              {adminTournaments.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  No admin tournaments
                </p>
              ) : (
                adminTournaments.map((t) => (
                  <div
                    key={t._id}
                    className="bg-slate-800 p-3 rounded-lg flex justify-between mb-2"
                  >
                    <div>
                      <div className="font-medium text-white">
                        {t.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {t._id}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/events/${t._id}`)}
                      className="px-3 py-1 bg-blue-600 rounded text-sm"
                    >
                      Open
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* PARTICIPANT */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Joined Tournaments
              </h3>

              {participantTournaments.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  No joined tournaments
                </p>
              ) : (
                participantTournaments.map((t) => (
                  <div
                    key={t._id}
                    className="bg-slate-800 p-3 rounded-lg flex justify-between mb-2"
                  >
                    <div>
                      <div className="font-medium text-white">
                        {t.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {t._id}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/events/${t._id}`)}
                      className="px-3 py-1 bg-slate-700 rounded text-sm"
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
