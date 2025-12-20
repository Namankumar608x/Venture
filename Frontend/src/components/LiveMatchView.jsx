import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axiosInstance from "../utils/axiosInstance";

export default function LiveMatchView() {
  const { eventId, matchId } = useParams();

  const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:5005`;

  const [match, setMatch] = useState(null);
  const [joined, setJoined] = useState(false); // 🔥 critical
  const socketRef = useRef(null);

  /* ================= FETCH MATCH ================= */
  const fetchMatch = async () => {
    console.log("📥 [VIEWER] fetching match:", matchId);
    const res = await axiosInstance.get(
      `/events/matches/${matchId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );
    setMatch(res.data);
  };

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!eventId || !matchId) return;
    if (socketRef.current) return;

    console.log("🟡 [VIEWER] creating socket");

    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
      auth: {
        token: localStorage.getItem("accessToken"),
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 [VIEWER] socket connected:", socket.id);

      // 🔥 ACK-BASED JOIN (NO RACE CONDITION)
      socket.emit(
  "join:event",
  { eventId: match.eventid }, // 🔥 REAL EVENT ID
  (ack) => {
    if (ack?.success) {
      console.log("📍 [VIEWER] joined event room:", match.eventid);
      setJoined(true);
    }
  }
);

    });

    /* 🔥 LIVE SCORE UPDATE */
    socket.on("match:round:update", (data) => {
      console.log("🔥 [VIEWER] round update received:", data);

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
      if (data.matchId === matchId) fetchMatch();
    });

    socket.on("match:ended", (data) => {
      console.log("🏆 [VIEWER] match ended:", data);
      if (data.matchId === matchId) fetchMatch();
    });

    socket.on("connect_error", (err) => {
      console.error("❌ [VIEWER] socket error:", err.message);
    });

    return () => {
      console.log("🔴 [VIEWER] socket disconnected");
      socket.disconnect();
      socketRef.current = null;
      setJoined(false);
    };
  }, [eventId, matchId]);

  /* ================= DERIVED ================= */
  const currentRound = useMemo(() => {
    if (!match) return null;
    return match.rounds.find((r) => !r.isCompleted);
  }, [match]);

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Loading match…
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white flex justify-center">
      <div className="bg-slate-800 rounded-xl p-6 max-w-xl w-full border border-slate-700">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {match.teamA.teamId.teamname} vs {match.teamB.teamId.teamname}
          </h2>

          {match.status === "live" && joined && (
            <span className="px-3 py-1 text-xs rounded-full bg-red-600 animate-pulse">
              LIVE
            </span>
          )}
        </div>

        <p className="text-sm text-slate-400 mb-6">
          {match.status === "live"
            ? `Round ${currentRound?.roundNo ?? "-"}`
            : "Match Finished"}
        </p>

        {/* SCORE */}
        <div className="flex justify-between text-center mb-8">
          <div className="flex-1">
            <p className="mb-2 text-slate-300">
              {match.teamA.teamId.teamname}
            </p>
            <p className="text-4xl font-bold">
              {currentRound?.teamA_score ?? 0}
            </p>
          </div>

          <div className="flex-1">
            <p className="mb-2 text-slate-300">
              {match.teamB.teamId.teamname}
            </p>
            <p className="text-4xl font-bold">
              {currentRound?.teamB_score ?? 0}
            </p>
          </div>
        </div>

        {/* ROUND HISTORY */}
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold mb-2">Rounds</h3>
          {match.rounds.map((r) => (
            <div
              key={r.roundNo}
              className={`flex justify-between px-3 py-2 rounded ${
                !r.isCompleted
                  ? "bg-slate-700"
                  : "bg-slate-800"
              }`}
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
            {match.winner.toString() === match.teamA.teamId._id.toString()
              ? match.teamA.teamId.teamname
              : match.teamB.teamId.teamname}
          </div>
        )}
      </div>
    </div>
  );
}
