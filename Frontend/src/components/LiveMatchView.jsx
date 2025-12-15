import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

export default function LiveMatchView() {
  const { eventId, matchId } = useParams(); // ✅ THIS WAS MISSING

  const [match, setMatch] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const auth = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  const fetchMatch = async () => {
    const res = await axios.get(
      `http://localhost:5005/events/matches/${matchId}`,
      auth()
    );

    setMatch(res.data);

    const activeRound = res.data.rounds?.find(
      r => r.roundNo === res.data.currentRound && !r.isCompleted
    );

    if (activeRound) {
      setScoreA(activeRound.teamA_score);
      setScoreB(activeRound.teamB_score);
    }
  };

  // 🔄 INITIAL FETCH
  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  // 🔴 SOCKET FOR LIVE SCORE
 useEffect(() => {
  if (!eventId || !matchId) return;

  const socket = io("http://localhost:5005", {
    auth: {
      token: localStorage.getItem("accessToken"),
    },
    transports: ["websocket"], // 🔥 IMPORTANT
  });

  socket.on("connect", () => {
    socket.emit("join:event", eventId); // ✅ AFTER CONNECT
  });

  socket.on("match:round:update", data => {
    if (data.matchId === matchId) {
      setScoreA(data.teamA_score);
      setScoreB(data.teamB_score);
    }
  });

  socket.on("match:round:ended", () => {
    fetchMatch();
  });

  socket.on("match:ended", () => {
    fetchMatch();
  });

  return () => socket.disconnect();
}, [eventId, matchId]);


  if (!match) return null;

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
            <p className="text-3xl font-bold">{scoreA}</p>
          </div>

          <div>
            <p className="mb-2">{match.teamB.teamId.teamname}</p>
            <p className="text-3xl font-bold">{scoreB}</p>
          </div>
        </div>

        {/* ROUNDS */}
        <div className="text-sm space-y-1">
          {match.rounds.map((r, i) => (
            <div key={i} className="flex justify-between">
              <span>Round {r.roundNo}</span>
              <span>{r.teamA_score} : {r.teamB_score}</span>
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
