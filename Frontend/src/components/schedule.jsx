import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function SchedulePage() {
const { clubid, eventId, scheduleid } = useParams();
const scheduleId = scheduleid;


  const [schedule, setSchedule] = useState(null);
  const [matches, setMatches] = useState([]);
  const [qualifiedTeams, setQualifiedTeams] = useState([]);
  const [role, setRole] = useState("participant");
  const [loading, setLoading] = useState(true);

  const getAuthConfig = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchScheduleInfo = async () => {
    try {
      const config = getAuthConfig();
      const res = await axios.get(
        `http://localhost:5005/schedule/${clubid}/${eventId}/${scheduleId}`,
        config
      );

      setSchedule(res.data.schedule);
      setMatches(res.data.matches);
      setQualifiedTeams(res.data.qualified || []);
      setRole(res.data.role);
    } catch (err) {
      console.error("Schedule fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleInfo();
  }, [scheduleId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading schedule…
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADING */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h1 className="text-3xl font-bold">{schedule.title}</h1>
          <p className="text-slate-400 mt-1">{schedule.date} • {schedule.time}</p>
          <p className="text-slate-400">{schedule.location}</p>
          {schedule.description && (
            <p className="mt-2 text-slate-300">{schedule.description}</p>
          )}
        </div>

        {/* MATCHES */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h2 className="text-xl font-semibold">Matches</h2>
          <div className="mt-4 space-y-4">
            {matches.length === 0 ? (
              <p className="text-slate-500 text-sm">No matches yet</p>
            ) : (
              matches.map((m) => (
                <div
                  key={m._id}
                  className="bg-slate-700 p-4 rounded-lg border border-slate-600"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-lg">
                        {m.teamA.teamname} vs {m.teamB.teamname}
                      </p>
                      <p className="text-xs text-slate-400">
                        {m.time}
                      </p>
                      <p className="text-xs mt-1">
                        Status:{" "}
                        <span className={`px-2 py-1 rounded text-xs ${
                          m.status === "upcoming" ? "bg-blue-600" :
                          m.status === "live" ? "bg-green-600" :
                          "bg-yellow-600"
                        }`}>
                          {m.status.toUpperCase()}
                        </span>
                      </p>
                    </div>

                    <div className="space-x-2">
                      {m.status === "live" && (
                        <button className="px-3 py-1 bg-red-600 rounded">Watch Live</button>
                      )}
                      <button className="px-3 py-1 bg-rose-600 rounded">Bid</button>

                      {role !== "participant" && (
                        <button className="px-3 py-1 bg-emerald-600 rounded">
                          Manage
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* QUALIFIED TEAMS */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h2 className="text-xl font-semibold">Qualified Teams</h2>

          {qualifiedTeams.length === 0 ? (
            <p className="text-slate-500 text-sm mt-2">No teams qualified yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {qualifiedTeams.map((t) => (
                <div
                  key={t._id}
                  className="p-3 bg-slate-700 rounded border border-slate-600"
                >
                  <p className="font-medium">{t.teamname}</p>
                  <p className="text-xs text-slate-400">
                    Members: {t.members.length}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
