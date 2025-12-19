import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../utils/axiosInstance";

// --- SUB-COMPONENTS (Defined outside to prevent re-mounting focus issues) ---

const OverviewTab = ({ event, role, admins, managers, clubid, eventId, setShowImageModal }) => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        {event?.imgURL ? (
          <div 
            className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700 group cursor-pointer"
            onClick={() => setShowImageModal(true)}
          >
            <img 
              src={event.imgURL} 
              alt={event.name} 
              className="w-full h-auto max-h-[500px] object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent flex flex-col justify-end p-6">
              <h2 className="text-3xl font-bold text-white mb-2">{event?.name}</h2>
              <div className="flex flex-wrap gap-3">
                <div className="px-3 py-1 bg-indigo-600/90 backdrop-blur-sm rounded-lg text-xs text-white border border-indigo-400/30">
                  <i className="fa-solid fa-users mr-2"></i>Max Team Size: {event?.maxPlayer}
                </div>
                <div className="px-3 py-1 bg-emerald-600/90 backdrop-blur-sm rounded-lg text-xs text-white border border-emerald-400/30">
                  <i className="fa-solid fa-user-shield mr-2"></i>Role: {role.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 rounded-2xl min-h-[200px] flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-white mb-2">{event?.name}</h2>
          </div>
        )}

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-3">About Event</h3>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{event?.description || "No description provided."}</p>
        </div>

        {event?.rules?.length > 0 && (
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-indigo-500">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-scale-balanced text-indigo-400"></i> Rules
            </h3>
            <div className="space-y-4">
              {event.rules.map((rule, idx) => (
                <div key={idx} className="bg-slate-800/30 p-4 rounded-xl">
                  {rule.title && <h4 className="font-semibold text-slate-200 mb-2 text-sm uppercase">{rule.title}</h4>}
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm">
                    {rule.points?.map((point, pIdx) => <li key={pIdx}>{point}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <i className="fa-solid fa-bullhorn text-indigo-400"></i> Announcements
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {event?.updates?.length > 0 ? (
              event.updates.slice().reverse().map((u) => (
                <div key={u._id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-slate-200 text-sm mb-2">{u.message}</p>
                  <span className="text-xs text-slate-500">{new Date(u.createdAt).toLocaleString()}</span>
                </div>
              ))
            ) : <div className="text-center py-8 text-slate-500 italic">No announcements yet.</div>}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="font-semibold text-slate-200 mb-3">Key People</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Admins</p>
              {admins.map(a => <div key={a._id} className="text-sm text-slate-300">{a.username}</div>)}
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Managers</p>
              {managers.length ? managers.map(m => <div key={m._id} className="text-sm text-slate-300">{m.username}</div>) : <span className="text-xs text-slate-600">-</span>}
            </div>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="font-semibold text-slate-200 mb-3">Quick Links</h3>
          <div className="flex flex-col gap-2">
            <Link to={`/events/${clubid}/${eventId}/bracket`} className="btn-secondary text-sm text-center">Bracket</Link>
            <Link to={`/events/${clubid}/${eventId}/matches`} className="btn-secondary text-sm text-center">Matches</Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ScheduleTab = ({ schedules, isAdmin, scheduleForm, setScheduleForm, postAction, eventId, navigate, clubid }) => (
  <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
    <div className="lg:col-span-2 space-y-4">
      {schedules.map(s => (
        <div key={s._id} onClick={() => navigate(`/events/${clubid}/${eventId}/${s._id}`)} className="glass-panel p-4 rounded-xl hover:border-indigo-500/50 cursor-pointer transition-all flex justify-between items-center group">
          <div>
            <h4 className="font-bold text-white group-hover:text-indigo-400">{s.title}</h4>
            <p className="text-xs text-slate-400 mt-1">{s.date} • {s.time} • {s.location}</p>
          </div>
          <i className="fa-solid fa-chevron-right text-slate-600"></i>
        </div>
      ))}
    </div>
    {isAdmin && (
      <div className="glass-panel p-5 rounded-2xl h-fit">
        <h3 className="font-bold text-white mb-4">Create Schedule</h3>
        <form onSubmit={(e) => { e.preventDefault(); postAction(`/schedule/${eventId}/new-schedule`, scheduleForm); }} className="space-y-3">
          <input className="input-field text-sm" placeholder="Title" value={scheduleForm.title} onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="input-field text-sm" onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })} />
            <input type="time" className="input-field text-sm" onChange={e => setScheduleForm({ ...scheduleForm, time: e.target.value })} />
          </div>
          <input className="input-field text-sm" placeholder="Location" value={scheduleForm.location} onChange={e => setScheduleForm({ ...scheduleForm, location: e.target.value })} />
          <textarea className="input-field text-sm h-20" placeholder="Description" value={scheduleForm.description} onChange={e => setScheduleForm({ ...scheduleForm, description: e.target.value })} />
          <button className="btn-primary w-full text-sm">Add Schedule</button>
        </form>
      </div>
    )}
  </div>
);

const TeamsTab = ({ teams, currentUser, isAdmin, event, eventId, teamForm, setTeamForm, postAction, navigate, clubid }) => {
  const myTeam = teams.find(t => t.members.some(m => String(m._id) === String(currentUser)));
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900">
        <h3 className="text-lg font-bold text-white mb-4">My Status</h3>
        {myTeam ? (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold text-indigo-400">{myTeam.teamname}</h4>
              <p className="text-sm text-slate-400">Members: {myTeam.members.length}</p>
            </div>
            <button onClick={() => navigate(`/events/${clubid}/${eventId}/team/${myTeam._id}`)} className="btn-primary text-sm">Manage Team</button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <p className="text-slate-400 text-sm">You are not in a team yet.</p>
            {(isAdmin || event?.teamsBy !== "admin") && event?.status === "registration" && (
              <form onSubmit={(e) => { e.preventDefault(); postAction("/teams/new-team", { teamname: teamForm.teamname, eventid: eventId }); }} className="flex gap-2 w-full md:w-auto">
                <input className="input-field text-sm py-2" placeholder="Team Name" value={teamForm.teamname} onChange={e => setTeamForm({ teamname: e.target.value })} />
                <button className="btn-primary py-2 text-sm">Create</button>
              </form>
            )}
          </div>
        )}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {teams.filter(t => t.isRegistered).map(t => (
          <div key={t._id} className="p-4 rounded-xl border bg-slate-800/60 border-emerald-500/30">
            <h4 className="font-bold text-slate-200">{t.teamname}</h4>
            <button onClick={() => navigate(`/events/${clubid}/${eventId}/team/${t._id}`)} className="text-xs text-indigo-400 mt-2">View Details →</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminTab = ({ searchQuery, setSearchQuery, searchResults, promoteForm, setPromoteForm, postAction, eventId, updateMsg, setUpdateMsg, schedules, teams, matchForm, setMatchForm }) => (
  <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">
    <div className="glass-panel p-6 rounded-2xl">
      <h3 className="font-bold text-white mb-4">Promote Members</h3>
      <input 
        className="input-field mb-2" 
        placeholder="Search user..." 
        value={searchQuery} 
        onChange={e => setSearchQuery(e.target.value)} 
      />
      {searchResults.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl mb-4 max-h-40 overflow-y-auto">
          {searchResults.map(u => (
            <div key={u._id} onClick={() => { setPromoteForm({ ...promoteForm, userid: u._id }); setSearchQuery(u.username); setSearchResults([]); }} className="p-2 hover:bg-slate-700 cursor-pointer text-sm">
              {u.username}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <select className="input-field" value={promoteForm.post} onChange={e => setPromoteForm({ ...promoteForm, post: e.target.value })}>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={() => postAction("/events/promote", { ...promoteForm, eventid: eventId })} className="btn-primary">Promote</button>
      </div>
    </div>

    <div className="glass-panel p-6 rounded-2xl">
      <h3 className="font-bold text-white mb-4">Post Announcement</h3>
      <textarea 
        className="input-field h-32 mb-4" 
        placeholder="What's happening?" 
        value={updateMsg} 
        onChange={e => setUpdateMsg(e.target.value)} 
      />
      <button onClick={() => { postAction("/events/updates", { eventid: eventId, message: updateMsg }); setUpdateMsg(""); }} className="btn-primary w-full">Post</button>
    </div>

    <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
      <h3 className="font-bold text-white mb-4">Quick Match Creation</h3>
      <div className="grid md:grid-cols-4 gap-3">
        <select className="input-field text-sm" onChange={e => setMatchForm({ ...matchForm, scheduleid: e.target.value })}>
          <option value="">Select Schedule</option>
          {schedules.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}
        </select>
        <select className="input-field text-sm" onChange={e => setMatchForm({ ...matchForm, teamA: e.target.value })}>
          <option value="">Team A</option>
          {teams.filter(t => t.isRegistered).map(t => <option key={t._id} value={t._id}>{t.teamname}</option>)}
        </select>
        <select className="input-field text-sm" onChange={e => setMatchForm({ ...matchForm, teamB: e.target.value })}>
          <option value="">Team B</option>
          {teams.filter(t => t.isRegistered).map(t => <option key={t._id} value={t._id}>{t.teamname}</option>)}
        </select>
        <button onClick={() => postAction("/events/match/create", { ...matchForm, eventid: eventId })} className="btn-danger text-sm">Create Match</button>
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export default function EventPage() {
  const { clubid, eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [role, setRole] = useState("participant");
  const [schedules, setSchedules] = useState([]);
  const [teams, setTeams] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showImageModal, setShowImageModal] = useState(false);

  // Forms
  const [scheduleForm, setScheduleForm] = useState({ title: "", date: "", time: "", location: "", description: "" });
  const [teamForm, setTeamForm] = useState({ teamname: "" });
  const [promoteForm, setPromoteForm] = useState({ userid: "", post: "manager" });
  const [updateMsg, setUpdateMsg] = useState("");
  const [matchForm, setMatchForm] = useState({ scheduleid: "", teamA: "", teamB: "", time: "" });
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const isAdmin = role === "admin" || role === "manager";

  const getAuthConfig = useCallback(() => {
    let token = localStorage.getItem("accessToken");
    if (!token) return null;
    try {
      const payload = jwtDecode(token);
      setCurrentUser(payload.id);
      return { headers: { Authorization: `Bearer ${token}` } };
    } catch { return null; }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const config = getAuthConfig();
      if (!config) return;
      const [evtRes, roleRes, schRes, teamRes] = await Promise.all([
        axiosInstance.get(`/events/${eventId}`, config),
        axiosInstance.get(`/events/roles/${eventId}`, config),
        axiosInstance.get(`/events/${eventId}/schedules`, config),
        axiosInstance.get(`/teams/${eventId}`, config)
      ]);
      setEvent(evtRes.data.event);
      setRole(evtRes.data.role);
      setAdmins(roleRes.data.admins);
      setManagers(roleRes.data.managers);
      setSchedules(schRes.data);
      setTeams(teamRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [eventId, getAuthConfig]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (!searchQuery.trim()) { setSearchResults([]); return; }
      axiosInstance.post("/auth/search-users", { q: searchQuery }, getAuthConfig())
        .then(res => setSearchResults(res.data))
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery, getAuthConfig]);

  const postAction = async (url, body) => {
    try {
      await axiosInstance.post(url, body, getAuthConfig());
      fetchAllData();
      alert("Success!");
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">Loading Event...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 text-sm text-slate-400 mb-1">
            <Link to="/home" className="hover:text-white">Home</Link>
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
            <span className="text-white">Event Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{event?.name}</h1>
        </div>
        {isAdmin && (
          <button onClick={() => navigate(`/events/${clubid}/${eventId}/edit`)} className="btn-secondary text-sm">
            <i className="fa-solid fa-gear mr-2"></i>Settings
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: "overview", label: "Overview", icon: "fa-chart-pie" },
          { id: "schedule", label: "Schedule", icon: "fa-calendar-days" },
          { id: "teams", label: "Teams", icon: "fa-people-group" },
          ...(isAdmin ? [{ id: "admin", label: "Admin Tools", icon: "fa-toolbox" }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === "overview" && <OverviewTab event={event} role={role} admins={admins} managers={managers} clubid={clubid} eventId={eventId} setShowImageModal={setShowImageModal} />}
        {activeTab === "schedule" && <ScheduleTab schedules={schedules} isAdmin={isAdmin} scheduleForm={scheduleForm} setScheduleForm={setScheduleForm} postAction={postAction} eventId={eventId} navigate={navigate} clubid={clubid} />}
        {activeTab === "teams" && <TeamsTab teams={teams} currentUser={currentUser} isAdmin={isAdmin} event={event} eventId={eventId} teamForm={teamForm} setTeamForm={setTeamForm} postAction={postAction} navigate={navigate} clubid={clubid} />}
        {activeTab === "admin" && isAdmin && (
          <AdminTab 
            searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            searchResults={searchResults} setSearchResults={setSearchResults}
            promoteForm={promoteForm} setPromoteForm={setPromoteForm}
            postAction={postAction} eventId={eventId}
            updateMsg={updateMsg} setUpdateMsg={setUpdateMsg}
            schedules={schedules} teams={teams}
            matchForm={matchForm} setMatchForm={setMatchForm}
          />
        )}
      </div>

      {showImageModal && event?.imgURL && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
            <img src={event.imgURL} alt={event.name} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            <button className="absolute top-4 right-4 bg-white/10 text-white w-10 h-10 flex items-center justify-center rounded-full" onClick={() => setShowImageModal(false)}>
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}