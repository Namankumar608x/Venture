import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function EventPage() {
  const { clubid,eventId } = useParams();
const [admins, setAdmins] = useState([]);
const [managers, setManagers] = useState([]);
const [schedules,setschedule]=useState([]);
const [teams,setteams]=useState([]);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [role, setRole] = useState("participant");
  const [currentUser, setCurrentUser] = useState("");
  const [message, setMessage] = useState("");
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
  });
  const navigate=useNavigate();

  const [teamForm, setTeamForm] = useState({ teamname: "" });
  const [promoteForm, setPromoteForm] = useState({
    userid: "",
    post: "manager",
  });
  const [updateMsg, setUpdateMsg] = useState("");
  const [matchForm, setMatchForm] = useState({
    scheduleid: "",
    teamA: "",
    teamB: "",
    time: "",
  });
useEffect(() => {
  const delay = setTimeout(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }
    console.log(searchQuery)

   axios.post(
  "http://localhost:5005/auth/search-users",
  { q: searchQuery, eventid: eventId },
  getAuthConfig()
)
      .then(res => setSearchResults(res.data))
      .catch(() => setSearchResults([]));

  }, 300); // debounce timeout

  return () => clearTimeout(delay);
}, [searchQuery]);
const fetchRoles = async () => {
  try {
    const config = getAuthConfig();
    if (!config) return;

    const res = await axios.get(
      `http://localhost:5005/events/roles/${eventId}`,
      config
    );

    setAdmins(res.data.admins);
    setManagers(res.data.managers);

  } catch (err) {
    console.log("Role fetch error:", err.response?.data);
  }
};
const fetchSchedules = async () => {
  try {
    const config = getAuthConfig();
    if (!config) return;

    const res = await axios.get(
      `http://localhost:5005/events/${eventId}/schedules`,
      config
    );

    setschedule(res.data);
  } catch (err) {
    console.log("Role fetch error:", err.response?.data);
  }
};
const fetchteams = async () => {
  try {
    const config = getAuthConfig();
    if (!config) return;

    const res = await axios.get(
      `http://localhost:5005/teams/${eventId}`,
      config
    );

    setteams(res.data);
  } catch (err) {
    console.log("Role fetch error:", err.response?.data);
  }
};
useEffect(() => {
  fetchEvent();
  fetchRoles();
  fetchSchedules();
  fetchteams();

}, [eventId]);
  // -----------------------------------------------------
  // AUTH HEADER
  // -----------------------------------------------------
  const getAuthConfig = () => {
    let token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const payload = jwtDecode(token);
      setCurrentUser(payload.id); // store logged-in user

      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("accessToken");
        return null;
      }
    } catch {
      localStorage.removeItem("accessToken");
      return null;
    }

    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // -----------------------------------------------------
  // FETCH EVENT
  // -----------------------------------------------------
  const fetchEvent = async () => {
    setLoading(true);
    try {
      const config = getAuthConfig();
      if (!config) return;

      const res = await axios.get(
        `http://localhost:5005/events/${eventId}`,
        config
      );

      setEvent(res.data.event);
      setRole(res.data.role);
    } catch (err) {
      setMessage("Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

 const handleEditEvent = () => {
  navigate(`/events/${clubid}/${eventId}/edit`);
};
  const postAction = async (url, body, successMsg) => {
    try {
      const config = getAuthConfig();
      if (!config) return;

      const res=await axios.post(url, body, config);
     
      fetchEvent();
      
      return res;
     
    } catch (err) {
      setMessage(err.response?.data?.message || "Action failed");
    }
  };

  // -----------------------------------------------------
  // ACTION FUNCTIONS
  // -----------------------------------------------------
  const handleSchedule = (e) => {
    e.preventDefault();
    postAction(
      `http://localhost:5005/schedule/${eventId}/new-schedule`,
      { ...scheduleForm,  },
      "Schedule created"
    );
  };

  const handleTeamCreate = (e) => {
    e.preventDefault();
    const res=postAction(
      "http://localhost:5005/teams/new-team",
      { teamname: teamForm.teamname, eventid: eventId },
      "Team created"
    );    
  setTeamForm({ teamname: "" });
  };

  const sendJoinRequest = (teamId) => {
    postAction(
      "http://localhost:5005/teams/team/join-request",
      { teamid: teamId },
      "Join request sent!"
    );
  };

  const approveRequest = (teamId, userId) => {
    postAction(
      "http://localhost:5005/teams/team/approve-request",
      { teamid: teamId, userid: userId },
      "User added to team"
    );
  };

  const handlePromote = (e) => {
    e.preventDefault();
    postAction(
      "http://localhost:5005/events/promote",
      { ...promoteForm, eventid: eventId },
      "User promoted"
    );
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    postAction(
      "http://localhost:5005/events/updates",
      { eventid: eventId, message: updateMsg },
      "Update posted"
    );
    setUpdateMsg("");
  };

  const handleMatch = (e) => {
    e.preventDefault();
    postAction(
      "http://localhost:5005/events/match/create",
      { ...matchForm, eventid: eventId },
      "Match created"
    );
  };

  // -----------------------------------------------------
  // UI UTIL CLASSES
  // -----------------------------------------------------
  const card =
    "bg-slate-800/50 border border-slate-700 shadow-lg rounded-xl p-5";
  const input =
    "w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 focus:outline-none";

  // -----------------------------------------------------
  // LOADING STATE
  // -----------------------------------------------------
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        Loading event...
      </div>
    );
    ///handleing query msg
    const handleQueryNavigation = () => {
  console.log("[EventPage] Navigate to query page, role =", role);

  if (role === "participant") {
    navigate(`/events/${clubid}/${eventId}/query`);
  } else {
    navigate(`/events/${clubid}/${eventId}/queries/admin`);
  }
};


  // -----------------------------------------------------
  // MAIN UI
  // -----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">{event?.name}</h1>
          <p className="text-slate-400 text-sm">Event ID: {event?._id}</p>
          <p className="text-xs text-blue-400 mt-1">Role: {role}</p>
        </div>
        <div className={card}>
  <h3 className="font-semibold mb-3">Event Roles</h3><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <div>
    <h1 className="text-3xl font-bold">{event?.name}</h1>
    <p className="text-slate-400 text-sm">Event ID: {event?._id}</p>
    <p className="text-xs text-blue-400 mt-1">Role: {role}</p>
  </div>

  {/* QUERY / MANAGE BUTTON */}
  <button
    onClick={handleQueryNavigation}
    className={`
      px-5 py-2 rounded-xl font-medium shadow-md transition
      ${role === "participant"
        ? "bg-indigo-600 hover:bg-indigo-700"
        : "bg-emerald-600 hover:bg-emerald-700"}
    `}
  >
    {role === "participant" ? "Raise a Query" : "Manage Queries"}
  </button>
   {/* EDIT EVENT (only admin / manager) */}
  {role !== "participant" && (
    <button
      onClick={handleEditEvent}
      className="px-5 py-2 rounded-xl font-medium bg-yellow-600 hover:bg-yellow-700 shadow-md transition"
    >
      Edit Event Details
    </button>
  )}
</div>


  <div className="mb-3">
    <h4 className="text-sm text-blue-400 mb-1">Admins</h4>
    {admins.length === 0 ? (
      <p className="text-xs text-slate-500">No admins</p>
    ) : (
      admins.map(a => (
        <p key={a._id} className="text-sm">
          {a.username} — <span className="text-slate-400">{a.email}</span>
        </p>
      ))
    )}
  </div>

  <div>
    <h4 className="text-sm text-emerald-400 mb-1">Managers</h4>
    {managers.length === 0 ? (
      <p className="text-xs text-slate-500">No managers</p>
    ) : (
      managers.map(m => (
        <p key={m._id} className="text-sm">
          {m.username} — <span className="text-slate-400">{m.email}</span>
        </p>
      ))
    )}
  </div>
</div>


        <div className="grid lg:grid-cols-3 gap-6">
          

          {/* ---------------- SCHEDULES ---------------- */}
          <div className={`${card} lg:col-span-2`}>
                <h2 className="text-xl font-semibold mb-4">Schedules</h2>
  

    <div className="space-y-3 mb-4">
      {schedules.length === 0 ? (
        <p className="text-slate-400 text-sm">No schedules yet.</p>
      ) : (
        schedules.map((s) => (
          <div
            key={s._id}
            onClick={() => navigate(`/events/${clubid}/${eventId}/${s._id}`)}
            className="p-3 bg-slate-700/50 rounded-lg border border-slate-600"
          >
            <div className="font-medium">{s.title}</div>
            <div className="text-xs text-slate-400">
              {s.date} • {s.time}
            </div>
            <div className="text-xs text-slate-400">{s.location}</div>
            {s.description && (
              <div className="text-sm text-slate-300 mt-1">
                {s.description}
              </div>
              
            )}
           
          </div>
        ))
      )}
    </div>


            {/* Admin-only create schedule */}
            
            {role !== "participant" && (
              
              <form onSubmit={handleSchedule} className="space-y-3">
            
                <input
                  className={input}
                  placeholder="Title"
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, title: e.target.value })
                  }
                />
                <div className="flex gap-3">
                  <input
                    type="date"
                    className={input}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, date: e.target.value })
                    }
                  />
                  <input
                    type="time"
                    className={input}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, time: e.target.value })
                    }
                  />
                </div>
                <input
                  className={input}
                  placeholder="Location"
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      location: e.target.value,
                    })
                  }
                />
                <textarea
                  className={input}
                  placeholder="Description"
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      description: e.target.value,
                    })
                  }
                />
                <button className="px-4 py-2 bg-blue-600 rounded-lg">
                  Create Schedule
                </button>
              </form>
            )}
          </div>
          

              {/* ---------------- TEAMS ---------------- */}
   <div className={card}>
  <h2 className="text-xl font-semibold mb-4">Teams</h2>
    <h3 className="text-lg font-semibold text-green-400 mb-2">Max team length: {event?.maxPlayer}</h3>

  {/* ---------------- MY TEAM SECTION ---------------- */}
  <h3 className="text-lg font-semibold text-blue-400 mb-2">My Team</h3>

  {(() => {
    const myTeam = teams.find((t) =>
      t.members.some(m => String(m._id) === String(currentUser))
    );

    if (!myTeam) {
      return (
        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-sm mb-3">
            You are not part of any team.
          </p>

          {/* Create team form */}
          <form onSubmit={handleTeamCreate} className="flex gap-2 mb-3">
            <input
              className={input}
              placeholder="Team name"
              value={teamForm.teamname}
              onChange={(e) =>
                setTeamForm({ teamname: e.target.value })
              }
            />
            <button className="px-3 bg-blue-600 rounded-lg">
              Create
            </button>
          </form>

         
        </div>
      );
    }

    // If user IS in a team
    return (
      <div className="p-3 bg-slate-700/40 rounded-lg border border-slate-600 mb-4">
        <div className="flex justify-between items-center">
          <p className="font-medium text-lg">{myTeam.teamname}</p>

          {myTeam.leader?._id === currentUser && (
            <button
              onClick={() =>
                navigate(`/events/${clubid}/${eventId}/team/${myTeam._id}`)
              }
              className="px-2 py-1 text-xs bg-blue-600 rounded"
            >
              Manage Team
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 mt-1">
          Leader: {myTeam.leader?.username}
        </div>
     

        <div className="text-xs text-slate-400">
          Members: {myTeam.members.length}
        </div>
          <div className="flex">
  {myTeam.isRegistered ? (
    <div className="ml-auto px-2 py-1 text-xs bg-green-600 text-white rounded">
      Registered
    </div>
  ) : (
    <div className="ml-auto px-2 py-1 text-xs bg-red-600 text-white rounded">
      Not Registered
    </div>
  )}
</div>
      </div>
    );
  })()}

  {/* ---------------- REGISTERED TEAMS ---------------- */}
  <h3 className="text-lg font-semibold text-emerald-400 mt-4 mb-2">
    Registered Teams
  </h3>

  {teams.filter(t => t.isRegistered).length === 0 ? (
    <p className="text-slate-400 text-sm">No registered teams yet.</p>
  ) : (
    teams
      .filter(t => t.isRegistered)
      .map((t) => (
        <div
          key={t._id}
          className="p-3 bg-slate-700/40 rounded-lg border border-slate-600 mb-3"
        >
          <div className="font-medium flex justify-between items-center">
            <span>{t.teamname}</span>
          </div>

          <div className="text-xs text-slate-400">
            Leader: {t.leader?.username}
          </div>

          <div className="text-xs text-slate-400">
            Members: {t.members.length}
          </div>
        </div>
      ))
  )}
</div>
        
</div>
        {/* ---------------- ADMIN PANEL ---------------- */}
        {role !== "participant" && (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Promote */}
            <div className={card}>
              <h3 className="font-semibold mb-2">Promote User</h3>
              <form onSubmit={handlePromote} className="space-y-2">
               <input
  className={input}
  placeholder="Search username or email"
  value={searchQuery}
  onChange={(e) => {
    setSearchQuery(e.target.value);
    setPromoteForm({
      ...promoteForm,
      userid: e.target.value,   // still store input
    });
  }}
/>
{searchResults.length > 0 && (
  <div className="mt-1 bg-gray-800 rounded-lg p-2 max-h-48 overflow-y-auto">
    {searchResults.map((u) => (
      <div
        key={u._id}
        className="p-2 hover:bg-gray-700 cursor-pointer rounded-md"
        onClick={() => {
          setPromoteForm({ ...promoteForm, userid: u._id });
          setSearchQuery(u.username || u.email);
          setSearchResults([]);
        }}
      >
        <p className="text-sm font-semibold">{u.username}</p>
        <p className="text-xs text-gray-400">{u.email}</p>
      </div>
    ))}
  </div>
)}

                <select
                  className={input}
                  value={promoteForm.post}
                  onChange={(e) =>
                    setPromoteForm({ ...promoteForm, post: e.target.value })
                  }
                >
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <button className="px-3 py-2 bg-blue-600 rounded-lg w-full">
                  Promote
                </button>
              </form>
            </div>

            {/* Updates */}
            <div className={card}>
              <h3 className="font-semibold mb-2">Post Update</h3>
              <form onSubmit={handleUpdate} className="space-y-2">
                <textarea
                  className={input}
                  placeholder="Write update..."
                  value={updateMsg}
                  onChange={(e) => setUpdateMsg(e.target.value)}
                />
                <button className="px-3 py-2 bg-emerald-600 rounded-lg w-full">
                  Post Update
                </button>
              </form>
            </div>

            {/* Create Match */}
            <div className={card}>
              <h3 className="font-semibold mb-2">Create Match</h3>
              <form onSubmit={handleMatch} className="space-y-2">
                <select
                  className={input}
                  value={matchForm.scheduleid}
                  onChange={(e) =>
                    setMatchForm({ ...matchForm, scheduleid: e.target.value })
                  }
                >
                  <option value="">Select schedule</option>
                  {schedules.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title} — {s.date}
                    </option>
                  ))}
                </select>

                <select
                  className={input}
                  value={matchForm.teamA}
                  onChange={(e) =>
                    setMatchForm({ ...matchForm, teamA: e.target.value })
                  }
                >
                  <option value="">Team A</option>
                  {event.teams.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.teamname}
                    </option>
                  ))}
                </select>

                <select
                  className={input}
                  value={matchForm.teamB}
                  onChange={(e) =>
                    setMatchForm({ ...matchForm, teamB: e.target.value })
                  }
                >
                  <option value="">Team B</option>
                  {event.teams.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.teamname}
                    </option>
                  ))}
                </select>

                <input
                  className={input}
                  placeholder="Match time"
                  value={matchForm.time}
                  onChange={(e) =>
                    setMatchForm({ ...matchForm, time: e.target.value })
                  }
                />

                <button className="px-3 py-2 bg-rose-600 rounded-lg w-full">
                  Create Match
                </button>
              </form>
            </div>
          </div>
        )
      }

        {/* ---------------- UPDATES ---------------- */}
        <div className={card}>
          <h2 className="text-xl font-semibold mb-3">Updates</h2>
          <div className="space-y-3">
            {event?.updates?.length > 0 ? (event.updates
              .slice()
              .reverse()
              .map((u) => (
                <div
                  key={u._id}
                  className="p-3 bg-slate-700/40 rounded border border-slate-600"
                >
                  <div className="text-xs text-slate-400">
                    {new Date(u.createdAt).toLocaleString()}
                  </div>
                  <div className="text-slate-200 mt-1">{u.message}</div>
                </div>
              ))):
               <div
                   
                  className="p-3 bg-slate-700/40 rounded border border-slate-600"
                > No updates
                </div>

                }
          </div>
        </div>

        {/* Global message */}
        {message && (
          <div className="p-3 rounded bg-slate-700 text-center">{message}</div>
        )}
     
      </div>
    </div>
   
  );
}