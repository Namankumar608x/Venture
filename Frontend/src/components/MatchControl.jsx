import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

export default function MatchControl() {
  const { matchId, clubid } = useParams();
  const navigate = useNavigate();

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

    const currentRound = res.data.rounds?.find(
      r => r.roundNo === res.data.currentRound
    );

    if (currentRound && !currentRound.isCompleted) {
      setScoreA(currentRound.teamA_score);
      setScoreB(currentRound.teamB_score);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  // 🔌 SOCKET LISTENERS
useEffect(() => {
  if (!match?.eventid) return;

  const socket = io("http://localhost:5005", {
    auth: {
      token: localStorage.getItem("accessToken"),
    },
  });

  socket.emit("join:event", match.eventid.toString());

  socket.on("match:round:update", (data) => {
    if (data.matchId === matchId) {
      setScoreA(data.teamA_score);
      setScoreB(data.teamB_score);
    }
  });

  socket.on("match:round:ended", (data) => {
    if (data.matchId === matchId) {
      fetchMatch();
    }
  });

  socket.on("match:winner:declared", (data) => {
    if (data.matchId === matchId) {
      navigate(`/events/${clubid}/${match.eventid}/winner`);
    }
  });

  return () => {
    socket.disconnect();
  };
}, [match, matchId, clubid, navigate]);


  // 🔄 UPDATE SCORE (SAFE)
  const updateScore = async (team, newScore) => {
    if (newScore < 0) return;

    await axios.put(
      `http://localhost:5005/events/matches/${matchId}/round/score`,
      { team, points: newScore },
      auth()
    );
  };

  const incA = () => {
    const val = scoreA + 1;
    setScoreA(val);
    updateScore("A", val);
  };

  const decA = () => {
    if (scoreA === 0) return;
    const val = scoreA - 1;
    setScoreA(val);
    updateScore("A", val);
  };

  const incB = () => {
    const val = scoreB + 1;
    setScoreB(val);
    updateScore("B", val);
  };

  const decB = () => {
    if (scoreB === 0) return;
    const val = scoreB - 1;
    setScoreB(val);
    updateScore("B", val);
  };

  // 🏁 END ROUND
  const endRound = async () => {
    await axios.post(
      `http://localhost:5005/events/matches/${matchId}/round/end`,
      {},
      auth()
    );
  };

  // 🏆 END MATCH
  const endMatch = async () => {
    await axios.post(
      `http://localhost:5005/events/matches/${matchId}/end`,
      {},
      auth()
    );
  };
   const startMatch = async () => {
  await axios.put(
    `http://localhost:5005/events/matches/${matchId}/status`,
    { status: "live" },
    auth()
  );
  fetchMatch();
};

  if (!match) return null;

  const card =
    "bg-slate-800 border border-slate-700 rounded-xl p-5 max-w-xl";

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className={card}>
        <h2 className="text-xl font-bold mb-4">Match Control</h2>

        <p className="mb-2">
          {match.teamA?.teamId?.teamname || "TBD"} vs{" "}
          {match.teamB?.teamId?.teamname || "TBD"}
        </p>

        <p className="text-sm text-slate-400 mb-4">
          Status: {match.status} | Round {match.currentRound}
        </p>
         {/* START MATCH */}
{match.status === "upcoming" && (
  <button
    onClick={startMatch}
    className="mb-4 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700"
  >
    Start Match
  </button>
)}

        {/* LIVE SCORE */}
        <div className="flex items-center justify-between mb-6">
          {/* TEAM A */}
          <div className="text-center">
            <p className="text-sm mb-2">
              {match.teamA?.teamId?.teamname}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={decA}
                disabled={match.status !== "live"}
                className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50"
              >
                −
              </button>
              <span className="text-2xl font-bold w-8 text-center">
                {scoreA}
              </span>
              <button
                onClick={incA}
                disabled={match.status !== "live"}
                className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          <span className="text-2xl font-bold">:</span>

          {/* TEAM B */}
          <div className="text-center">
            <p className="text-sm mb-2">
              {match.teamB?.teamId?.teamname}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={decB}
                disabled={match.status !== "live"}
                className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50"
              >
                −
              </button>
              <span className="text-2xl font-bold w-8 text-center">
                {scoreB}
              </span>
              <button
                onClick={incB}
                disabled={match.status !== "live"}
                className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={endRound}
            disabled={match.status !== "live"}
            className="px-4 py-2 bg-indigo-600 rounded-lg disabled:opacity-50"
          >
            End Round
          </button>

          <button
            onClick={endMatch}
            disabled={match.status !== "live"}
            className="px-4 py-2 bg-emerald-600 rounded-lg disabled:opacity-50"
          >
            End Match
          </button>
        </div>

        {/* ROUND HISTORY */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-slate-300">
            Rounds
          </h3>

          {match.rounds?.map(r => (
            <div
              key={r.roundNo}
              className="flex justify-between text-sm text-slate-300 mb-1"
            >
              <span>Round {r.roundNo}</span>
              <span>
                {r.teamA_score} : {r.teamB_score}
              </span>
              <span className="text-green-400">
                {r.winner
                  ? r.winner.toString() ===
                    match.teamA.teamId._id
                    ? match.teamA.teamId.teamname
                    : match.teamB.teamId.teamname
                  : "-"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
