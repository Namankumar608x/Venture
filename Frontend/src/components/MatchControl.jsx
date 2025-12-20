import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axiosInstance from "../utils/axiosInstance";

export default function MatchControl() {
  const { matchId } = useParams();

  const [match, setMatch] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const socketRef = useRef(null);
  const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:5005`;

  const auth = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  /* ================= FETCH MATCH ================= */
  const fetchMatch = async () => {
    const res = await axiosInstance.get(
      `/events/matches/${matchId}`,
      auth()
    );

    const data = res.data;
    setMatch(data);

    const active = data.rounds.find(r => !r.isCompleted);

    if (active) {
      setScoreA(active.teamA_score);
      setScoreB(active.teamB_score);
    } else {
      setScoreA(0);
      setScoreB(0);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!match?.eventid) return;
    if (socketRef.current) return;

    const socket = io(BACKEND_URL, {
      auth: {
        token: localStorage.getItem("accessToken"),
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join:event", {
        eventId: match.eventid.toString(),
      });
    });

    socket.on("match:round:update", data => {
      if (data.matchId === matchId) {
        setScoreA(data.teamA_score);
        setScoreB(data.teamB_score);

        // 🔥 sync full match state (important)
        fetchMatch();
      }
    });

    socket.on("match:round:ended", data => {
      if (data.matchId === matchId) fetchMatch();
    });

    socket.on("match:ended", data => {
      if (data.matchId === matchId) fetchMatch();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [match?.eventid, matchId]);

  /* ================= DERIVED STATE ================= */
  const activeRound = useMemo(() => {
    if (!match) return null;
    return match.rounds.find(r => !r.isCompleted);
  }, [match]);

  const displayRoundNo = activeRound
    ? activeRound.roundNo
    : match
    ? match.rounds.length + 1
    : 1;

  /* ================= ACTIONS ================= */
  const startMatch = async () => {
    await axiosInstance.post(
      `/events/matches/${matchId}/start`,
      {},
      auth()
    );
    fetchMatch();
  };

  const updateScore = async (team, val) => {
    if (match.status !== "live") return;

    await axiosInstance.put(
      `/events/matches/${matchId}/round/score`,
      { team, points: val },
      auth()
    );

    // ensure UI never lags
    fetchMatch();
  };

  const incA = () => {
    const v = scoreA + 1;
    setScoreA(v);
    updateScore("A", v);
  };

  const decA = () => {
    if (scoreA === 0) return;
    const v = scoreA - 1;
    setScoreA(v);
    updateScore("A", v);
  };

  const incB = () => {
    const v = scoreB + 1;
    setScoreB(v);
    updateScore("B", v);
  };

  const decB = () => {
    if (scoreB === 0) return;
    const v = scoreB - 1;
    setScoreB(v);
    updateScore("B", v);
  };

  const endRound = async () => {
    if (match.status !== "live") return;

    await axiosInstance.post(
      `/events/matches/${matchId}/round/end`,
      {},
      auth()
    );

    fetchMatch();
  };

  const endMatch = async () => {
  if (match.status !== "live") return;

  await axiosInstance.post(
    `/events/matches/${matchId}/end`,
    {},
    auth()
  );

  fetchMatch();
};


  if (!match) return null;

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 max-w-xl">
        <h2 className="text-xl font-bold mb-4">Match Control</h2>

        <p className="mb-2">
          {match.teamA.teamId.teamname} vs {match.teamB.teamId.teamname}
        </p>

        <p className="text-sm text-slate-400 mb-4">
          Status: {match.status} | Round {displayRoundNo}
        </p>

        {match.status === "upcoming" && (
          <button
            onClick={startMatch}
            className="mb-4 px-4 py-2 bg-green-600 rounded"
          >
            Start Match
          </button>
        )}

        {/* SCORE */}
        <div className="flex justify-between mb-6">
          {[
            { key: "A", name: match.teamA.teamId.teamname, score: scoreA },
            { key: "B", name: match.teamB.teamId.teamname, score: scoreB },
          ].map(t => (
            <div key={t.key} className="text-center">
              <p className="mb-2">{t.name}</p>
              <div className="flex items-center gap-3">
                <button onClick={t.key === "A" ? decA : decB}>−</button>
                <span className="text-2xl">{t.score}</span>
                <button onClick={t.key === "A" ? incA : incB}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={endRound}
            disabled={
              match.status !== "live" ||
              (scoreA === 0 && scoreB === 0)
            }
            className="px-4 py-2 bg-indigo-600 rounded disabled:opacity-50"
          >
            End Round
          </button>

          <button
            onClick={endMatch}
            disabled={match.status !== "live"}
            className="px-4 py-2 bg-emerald-600 rounded disabled:opacity-50"
          >
            End Match
          </button>
        </div>

        {/* HISTORY */}
        <div>
          <h3 className="mb-2">Rounds</h3>
          {match.rounds.map(r => (
            <div key={r._id}>
              Round {r.roundNo}: {r.teamA_score} : {r.teamB_score}
            </div>
          ))}
        </div>

        {match.winner && (
          <div className="mt-4 p-3 bg-green-700 rounded text-center">
            🏆 Winner:{" "}
            {match.winner.toString() === match.teamA.teamId._id
              ? match.teamA.teamId.teamname
              : match.teamB.teamId.teamname}
          </div>
        )}
      </div>
    </div>
  );
}
