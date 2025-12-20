import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axiosInstance from "../utils/axiosInstance";

export default function LiveMatchView() {
  const { matchId } = useParams();

  const BACKEND_URL = `localhost:5005`;

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  /* ================= FETCH MATCH ================= */
  
  useEffect(() => {
  let intervalId;

  const fetchMatch = async () => {
    try {
      console.log("📥 [VIEWER] fetching match:", matchId);
      const res = await axiosInstance.get(`/events/matches/${matchId}`);
      setMatch(res.data);
    } catch (err) {
      console.error("❌ [VIEWER] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // initial fetch
  fetchMatch();

  // 🔁 poll every 5 seconds
  intervalId = setInterval(fetchMatch, 4500);

  // cleanup
  return () => {
    clearInterval(intervalId);
  };
}, [matchId]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!match || !match.eventid) return;
    if (socketRef.current) return;

    const eventId = match.eventid.toString(); // 🔥 CRITICAL FIX

    console.log("🟡 [VIEWER] creating socket for event:", eventId);

    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
      auth: {
        token: localStorage.getItem("accessToken"),
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 [VIEWER] socket connected:", socket.id);

      socket.emit("join:event", { eventId }, (ack) => {
        console.log("📍 [VIEWER] join:event ACK:", ack);
      });
    });

    /* 🔥 LIVE SCORE UPDATE */
    socket.on("match:round:update", (data) => {
      console.log("🔥 [VIEWER] live update:", data);

      if (data.matchId !== matchId) return;

      setMatch((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          rounds: prev.rounds.map((r) =>
            r.roundNo === data.roundNo
              ? {
                  ...r,
                  teamA_score: data.teamA_score,
                  teamB_score: data.teamB_score,
                }
              : r
          ),
        };
      });
    });

    socket.on("match:round:ended", (data) => {
      console.log("🏁 [VIEWER] round ended:", data);
    });

    socket.on("match:ended", (data) => {
      console.log("🏆 [VIEWER] match ended:", data);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ [VIEWER] socket error:", err.message);
    });

    return () => {
      console.log("🔴 [VIEWER] socket disconnected");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [match, matchId]);

  /* ================= DERIVED STATE ================= */
  const activeRound = useMemo(() => {
    if (!match) return null;
    return match.rounds.find((r) => !r.isCompleted);
  }, [match]);

  /* ================= UI ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading live match…
      </div>
    );
  }

  if (!match) return null;

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="bg-slate-800 rounded-xl p-6 max-w-xl mx-auto shadow-lg">
        <h2 className="text-xl font-bold text-center mb-1">
          {match.teamA.teamId.teamname} vs {match.teamB.teamId.teamname}
        </h2>

        <p className="text-sm text-slate-400 text-center mb-6">
          {match.status === "live"
            ? `🔴 Live — Round ${activeRound?.roundNo ?? "-"}`
            : "Match Finished"}
        </p>

        {/* SCORE */}
        <div className="flex justify-between text-center mb-6">
          <div className="flex-1">
            <p className="mb-2 font-semibold">
              {match.teamA.teamId.teamname}
            </p>
            <p className="text-4xl font-bold">
              {activeRound?.teamA_score ?? 0}
            </p>
          </div>

          <div className="flex-1">
            <p className="mb-2 font-semibold">
              {match.teamB.teamId.teamname}
            </p>
            <p className="text-4xl font-bold">
              {activeRound?.teamB_score ?? 0}
            </p>
          </div>
        </div>

        {/* ROUND HISTORY */}
        <div className="text-sm space-y-2">
          {match.rounds.map((r) => (
            <div
              key={r.roundNo}
              className="flex justify-between bg-slate-700 px-3 py-1 rounded"
            >
              <span>Round {r.roundNo}</span>
              <span>
                {r.teamA_score} : {r.teamB_score}
              </span>
            </div>
          ))}
        </div>

        {/* WINNER */}
        {match.winner && (
          <div className="mt-6 bg-green-700 p-3 rounded text-center font-semibold">
            🏆 Winner:{" "}
            {match.winner === match.teamA.teamId._id
              ? match.teamA.teamId.teamname
              : match.teamB.teamId.teamname}
          </div>
        )}
      </div>
    </div>
  );
}
