import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function EventMatches() {
  const { clubid, eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [stages, setStages] = useState([]);
  const [role, setRole] = useState("participant");
  const [loading, setLoading] = useState(true);

  const auth = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  /* ===========================
     FETCH EVENT + ROLE
     =========================== */
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5005/events/${eventId}`,
          auth()
        );

        console.log("[DEBUG] Event API response:", res.data);

        setEvent(res.data.event);
        setRole(res.data.role);
      } catch (err) {
        console.error("[ERROR] Fetch event failed", err);
      }
    };

    fetchEvent();
  }, [eventId]);

  /* ===========================
     FETCH STAGES + MATCHES
     =========================== */
  useEffect(() => {
    if (!eventId) return;

    const fetchStages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5005/events/${eventId}/stages`,
          auth()
        );

        console.log("[DEBUG] Stages:", res.data);
        setStages(res.data);
        setLoading(false);
      } catch (err) {
        console.error("[ERROR] Fetch stages failed", err);
        setLoading(false);
      }
    };

    fetchStages();
  }, [eventId]);

  /* ===========================
     ROLE CHECK
     =========================== */
  const isAdmin = role === "admin" || role === "manager";

  console.log("[DEBUG] role:", role, "isAdmin:", isAdmin);

  /* ===========================
     UI HELPERS
     =========================== */
  const statusColor = (status) => {
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

  if (!event) return null;

  /* ===========================
     RENDER
     =========================== */
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Matches</h1>

      {stages.map((stage) => (
        <div key={stage._id} className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            {stage.name}
          </h2>

          <div className="space-y-3">
            {stage.matches.map((match) => {
              const teamA = match.teamA?.teamId?.teamname || "TBD";
              const teamB = match.teamB?.teamId?.teamname || "TBD";

              return (
                <div
                  key={match._id}
                  onClick={() => {
                    if (isAdmin) {
                      navigate(
                        `/events/${clubid}/${eventId}/matches/${match._id}`
                      );
                    }
                  }}
                  className={`flex justify-between items-center p-4 rounded-xl border border-slate-700
                    ${isAdmin ? "cursor-pointer hover:bg-slate-800" : "opacity-70 cursor-not-allowed"}
                    bg-slate-800`}
                >
                  <div>
                    <p className="font-medium">
                      {teamA} vs {teamB}
                    </p>

                    {!isAdmin && (
                      <p className="text-xs text-slate-400">
                        Only admins can control matches
                      </p>
                    )}
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
