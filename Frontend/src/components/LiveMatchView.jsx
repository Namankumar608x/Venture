import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import axiosInstance from "../utils/axiosInstance";
export default function LiveMatchView() {
  const { eventId, matchId } = useParams();

  const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:5005`;

  const [match, setMatch] = useState(null);
  const socketRef = useRef(null);

  const auth = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  /* ================= INITIAL FETCH ================= */
  const fetchMatch = async () => {
    const res = await axiosInstance.get(
      `${BACKEND_URL}/events/matches/${matchId}`,
      auth()
    );
    setMatch(res.data);
  };

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!eventId || !matchId) return;
    if (socketRef.current) return; // prevent duplicate sockets

    console.log("🟡 [VIEWER] creating socket");

    const socket = io(BACKEND_URL, {
      transports: ["websocket"], // 🔥 IMPORTANT FIX
      auth: {
        token: localStorage.getItem("accessToken"),
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 [VIEWER] socket connected:", socket.id);
      socket.emit("join:event", { eventId });
    });

    /* 🔥 LIVE SCORE UPDATE */
    socket.on("match:round:update", (data) => {
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
      if (data.matchId === matchId) fetchMatch();
    });

    socket.on("match:ended", (data) => {
      if (data.matchId === matchId) fetchMatch();
    });

    socket.on("connect_error", (err) => {
      console.error("❌ [VIEWER] socket error:", err.message);
    });

    return () => {
      console.log("🔴 [VIEWER] socket disconnected");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [eventId, matchId]);

  if (!match) return null;

  const currentRound = match.rounds.find(
    (r) => r.roundNo === match.currentRound
  );

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="bg-slate-800 rounded-xl p-6 max-w-xl mx-auto">
        <h2 className="text-xl font-bold mb-2">
          {match.teamA.teamId.teamname} vs {match.teamB.teamId.teamname}
        </h2>

        <p className="text-sm text-slate-400 mb-4">
          {match.status === "live"
            ? `Live — Round ${match.currentRound}`
            : "Match Finished"}
        </p>

        {/* SCORE */}
        <div className="flex justify-between text-center mb-6">
          <div>
            <p className="mb-2">{match.teamA.teamId.teamname}</p>
            <p className="text-3xl font-bold">
              {currentRound?.teamA_score ?? 0}
            </p>
          </div>

          <div>
            <p className="mb-2">{match.teamB.teamId.teamname}</p>
            <p className="text-3xl font-bold">
              {currentRound?.teamB_score ?? 0}
            </p>
          </div>
        </div>

        {/* ROUNDS */}
        <div className="text-sm space-y-1">
          {match.rounds.map((r) => (
            <div key={r.roundNo} className="flex justify-between">
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
