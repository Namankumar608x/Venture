import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function EventMatches() {
  const { clubid, eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [role, setRole] = useState("participant");
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const auth = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  const isAdmin = role === "admin" || role === "manager";

  /* ================= FETCH EVENT ================= */
  useEffect(() => {
    const fetchEvent = async () => {
      const res = await axios.get(
        `http://localhost:5005/events/${eventId}`,
        auth()
      );
      setEvent(res.data.event);
      setRole(res.data.role);
    };
    fetchEvent();
  }, [eventId]);

  /* ================= FETCH STAGES ================= */
  const fetchStages = async () => {
    const res = await axios.get(
      `http://localhost:5005/events/${eventId}/stages`,
      auth()
    );
    setStages(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStages();
  }, [eventId]);

  /* ================= GENERATE SCHEDULE ================= */
  const generateSchedule = async () => {
    setLoadingSchedule(true);
    await axios.post(
      `http://localhost:5005/events/${eventId}/schedule`,
      {},
      auth()
    );
    await fetchStages();
    setLoadingSchedule(false);
  };

  const scheduleExists = stages.length > 0;

  const statusColor = status => {
    if (status === "finished") return "bg-emerald-600";
    if (status === "live") return "bg-yellow-500";
    return "bg-slate-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Loading matches...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Matches</h1>

        {isAdmin && (
          <button
            onClick={generateSchedule}
            disabled={scheduleExists || loadingSchedule}
            className={`px-4 py-2 rounded-lg ${
              scheduleExists
                ? "bg-slate-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {scheduleExists
              ? "Schedule Generated"
              : loadingSchedule
              ? "Generating..."
              : "Generate Schedule"}
          </button>
        )}
      </div>

      {stages.map(stage => (
        <div key={stage._id} className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            {stage.name}
          </h2>

          <div className="space-y-3">
            {stage.matches.map(match => {
              const teamA =
                match.teamA?.teamId?.teamname || "TBD";
              const teamB =
                match.teamB?.teamId?.teamname || "TBD";

              return (
                // ONLY relevant part changed (safe)

<div
  key={match._id}
  onClick={() => {
    if (isAdmin) {
      navigate(
        `/events/${clubid}/${eventId}/matches/${match._id}`
      );
    } else {
      navigate(
        `/events/${clubid}/${eventId}/matches/${match._id}/live`
      );
    }
  }}
  className={`flex justify-between items-center p-4 rounded-xl border border-slate-700 bg-slate-800
    cursor-pointer hover:bg-slate-700`}
>
  <div>
    <p className="font-medium">
      {teamA} vs {teamB}
    </p>
  </div>

  <span
    className={`text-xs px-3 py-1 rounded-full ${statusColor(
      match.status
    )}`}
  >
    {match.status}
  </span>
</div>

              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
