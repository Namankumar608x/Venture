import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate,useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import EventCard from "./EventCard";

function EventsDashboard() {
    const { clubid } = useParams();
  const [myAdminClubs, setMyAdminClubs] = useState([]);
  const [participantClubs, setParticipantClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(clubid);
  const [status,setstatus]=useState("");
    const [teamc,setteamc]=useState("");
  const [event, setEvent] = useState({
    name: "",
    description: "",
    maxPlayer: "",
  });
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);
const FRONTEND_URL="localhost:5173";
  const link=`${FRONTEND_URL}/events/${clubid}/login`;
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    fetchClubs();
  }, []);

  const getAuthConfig = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setMessage("Please login again.");
      return null;
    }
    try {
      const payload = jwtDecode(token);
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        localStorage.removeItem("accessToken");
        setMessage("Please login again, session expired.");
        return null;
      }
    } catch (e) {
      localStorage.removeItem("accessToken");
      setMessage("Please login again, session expired.");
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const fetchClubs = async () => {
    try {
      setMessage("");
      const config = getAuthConfig();
      if (!config) return;
      // existing endpoints used in Home.jsx
      const [adminRes, partRes] = await Promise.all([
        axios.get("http://localhost:5005/clubs/my-admin", config),
        axios.get("http://localhost:5005/clubs/participant", config),
      ]);
      setMyAdminClubs(adminRes.data.tournaments || adminRes.data.clubs || []);
      setParticipantClubs(partRes.data.tournaments || partRes.data.clubs || []);
      // pick the first admin club as default selection
      const first = (adminRes.data.tournaments || adminRes.data.clubs || [])[0];
      if (first) setSelectedClub(first._id || first.id);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to load clubs");
    }
  };
  
const sharelink=()=>{
setShowShare(true);
};
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!selectedClub) {
      setMessage("Select a club (tournament) to create the event under.");
      return;
    }
    if (!event.name.trim()) {
      setMessage("Event name required.");
      return;
    }
    setIsCreating(true);
    setMessage("");
    try {
      const config = getAuthConfig();
      if (!config) return;
      const res = await axios.post(
        "http://localhost:5005/events/new",
        { clubid: selectedClub, ...event,status,teamc },
        config
      );
      setMessage(res.data?.message || "Event created");
      setEvent({ name: "", description: "", maxPlayer: "" });
     const updatedEvents = await fetchEventsForClub(selectedClub);
setClubEvents(updatedEvents);
      if (res.data?.eventId) navigate(`/events/${res.data.eventId}`);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to create event");
    } finally {
      setIsCreating(false);
    }
  };

  const fetchEventsForClub = async (clubId) => {
    try {
      const config = getAuthConfig();
      if (!config) return [];

      const res = await axios.get(
        `http://localhost:5005/events/club/${clubId}`,
        config
      );

      return res.data.events || []; // return the array
    } catch (err) {
      console.error("fetchEventsForClub error", err);
      setMessage(err.response?.data?.message || "Failed to load events");
      return [];
    }
  };

  // quick preview state for events under selected club
  const [clubEvents, setClubEvents] = useState([]);
  useEffect(() => {
    (async () => {
      if (!selectedClub) return setClubEvents([]);
      const events = await fetchEventsForClub(selectedClub);
      setClubEvents(events);
    })();
    // eslint-disable-next-line
  }, [selectedClub]);

  return (
   
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-start justify-center">
      <div className="w-full max-w-5xl relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
             {showShare && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center">

    {/* BACKDROP */}
    <div
      className="absolute inset-0 bg-black/60"
      onClick={() => setShowShare(false)}
    />

    {/* MODAL BOX */}
    <div className="relative bg-slate-800 w-full max-w-md rounded-xl shadow-2xl p-6 z-[10000]">

      <h2 className="text-lg font-semibold mb-3 text-white">
        Share Link
      </h2>

      {/* LINK BOX */}
      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded">
        <input
          value={link}
          readOnly
          className="flex-1 bg-transparent text-sm text-slate-300 outline-none"
        />

        <button
          onClick={() => {
            navigator.clipboard.writeText(link);
            alert("Link copied!");
          }}
          className="px-3 py-1 bg-blue-600 rounded text-xs"
        >
          Copy
        </button>
      </div>

      {/* CLOSE */}
      <div className="text-right mt-4">
        <button
          onClick={() => setShowShare(false)}
          className="text-sm text-slate-400 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Events <span className="text-blue-500">Manager</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Create events inside your clubs.
            </p>
          </div>
            <button
            onClick={sharelink}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
          >
            Share direct link to join your club
          </button>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Create Event
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Select club (tournament) and create an event inside it.
              </p>

              <form onSubmit={handleCreateEvent} className="space-y-3">
                <select
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select a club (tournament)</option>
                  {myAdminClubs.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name || `Club ${c._id || c.id}`}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={event.name}
                  onChange={(e) => setEvent({ ...event, name: e.target.value })}
                  placeholder="Event name(e.g. Football Club 2026)"
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  value={event.description}
                  onChange={(e) =>
                    setEvent({ ...event, description: e.target.value })
                  }
                  placeholder="Event description"
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="number"
                  value={event.maxPlayer}
                  onChange={(e) =>
                    setEvent({ ...event, maxPlayer: e.target.value })
                  }
                  placeholder="Max players in a team"
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                 <select
                  value={status}
                  onChange={(e) => setstatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select status</option>
                  
                    <option key="registration" value="registration">
                     Registration Open
                    </option>
                     <option key="draft" value="draft">
                     Draft
                    </option>
             
                </select>
                <select
                  value={teamc}
                  onChange={(e) => setteamc(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select team creation rights</option>
                  
                    <option key="admin" value="admin">
                    Admin/Manager's only
                    </option>
                     <option key="users" value="users">
                     All users
                    </option>
             
                </select>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition duration-150 disabled:opacity-50 text-sm"
                >
                  {isCreating ? "Creating..." : "Create Event"}
                </button>
              </form>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Quick Actions
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Use the event list below to open event dashboard, or paste an
                event ID to open.
              </p>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste Event ID to open"
                    className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    id="openEventId"
                  />
                  <button
                    onClick={() => {
                      const val = document
                        .getElementById("openEventId")
                        .value.trim();
                      if (val) navigate(`/events/${val}`);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm border border-slate-700 hover:bg-slate-700 transition"
                  >
                    Open
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Selected Club Events
                  </h3>
                  {clubEvents.length === 0 ? (
                    <p className="text-slate-500 text-sm">
                      No events for this club yet.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {clubEvents.map((ev) => (
                        <EventCard
                          key={ev._id || ev.id}
                          event={ev}
                          onOpen={() =>
                            navigate(
                              `/events/${selectedClub}/${ev._id || ev.id}`
                            )
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className="mt-6">
              <div className="p-3 rounded-lg text-sm text-center bg-slate-800/70 border border-slate-700 text-slate-100">
                {message}
              </div>
            </div>
          )}

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Your Clubs (Admin)
              </h3>
              {myAdminClubs.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  You don't admin any clubs yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {myAdminClubs.map((c) => (
                    <div
                      key={c._id || c.id}
                      className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 flex justify-between items-center text-sm text-slate-100"
                    >
                      <div>
                        <div className="font-medium">
                          {c.name || "Unnamed Club"}
                        </div>
                        <div className="text-xs text-slate-400">
                          ID: {c._id || c.id}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedClub(c._id || c.id)}
                        className="text-xs px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Clubs You Joined
              </h3>
              {participantClubs.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  You haven't joined any clubs yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {participantClubs.map((c) => (
                    <div
                      key={c._id || c.id}
                      className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 flex justify-between items-center text-sm text-slate-100"
                    >
                      <div>
                        <div className="font-medium">
                          {c.name || "Unnamed Club"}
                        </div>
                        <div className="text-xs text-slate-400">
                          ID: {c._id || c.id}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedClub(c._id || c.id)}
                        className="text-xs px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventsDashboard;
