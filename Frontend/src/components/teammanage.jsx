import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function TeamManagePage() {
  const { eventId, teamid } = useParams();

  const [team, setTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [maxlength,setmaxlength]=useState(1);
  const getAuthConfig = () => {
    let token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const payload = jwtDecode(token);
      if (payload.exp * 1000 < Date.now()) return null;
    } catch {
      return null;
    }

    return { headers: { Authorization: `Bearer ${token}` } };
  };
  const fetchEvent = async () => {
   
    try {
      const config = getAuthConfig();
      if (!config) return;

      const res = await axios.get(
        `http://localhost:5005/events/${eventId}`,
        config
      );
     console.log(res.data.event.maxPlayer);
     setmaxlength(res.data.event.maxPlayer);
    } catch (err) {
      setMessage("Failed to load event");
    } 
  };
  /* -----------------------------------------------------------
        FETCH TEAM DETAILS
  ------------------------------------------------------------ */
  const fetchTeam = async () => {
    const config = getAuthConfig();
    const res = await axios.get(
      `http://localhost:5005/teams/team/${teamid}`,
      config
    );
    setTeam(res.data);
  };

  useEffect(() => {
    fetchEvent();
    fetchTeam();
  }, []);

  /* -----------------------------------------------------------
        SEARCH USERS FOR INVITE 
        (uses your EXACT search route)
  ------------------------------------------------------------ */
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery.trim() === "") {
        setSearchResults([]);
        return;
      }

      axios
        .post(
          "http://localhost:5005/auth/search-users",
          { q: searchQuery, eventid: eventId },
          getAuthConfig()
        )
        .then((res) => setSearchResults(res.data))
        .catch(() => setSearchResults([]));
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  /* -----------------------------------------------------------
        TEAM ACTIONS
  ------------------------------------------------------------ */

 const inviteUser = async (userid) => {
  try {
    const res = await axios.post(
      "http://localhost:5005/teams/invite",
      { teamid, userid },
      getAuthConfig()
    );

    alert(res.data.message);   
    fetchTeam();
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Invite failed");
  }
};


  const removeUser = async (userid) => {
    await axios.post(
      "http://localhost:5005/teams/remove",
      { teamid, userid },
      getAuthConfig()
    );
    fetchTeam();
  };

  const transferLeadership = async (userid) => {
    await axios.post(
      "http://localhost:5005/teams/transfer-leader",
      { teamid, userid },
      getAuthConfig()
    );
    fetchTeam();
  };

  return (
    <div className="p-6 text-white">
      {team && (
        <>
          {/* TEAM HEADER */}
          <h1 className="text-2xl font-bold">{team.teamname}</h1>
          <p className="text-slate-400">
            Leader: {team.leader?.username || team.leader?.name}
          </p>

          {/* MEMBERS LIST */}
          <h2 className="text-lg mt-4 mb-2 font-semibold">Members ({team.members.length})</h2>
            
       {team.members.map((m) => {
  const memberId = m._id?.toString();
  const leaderId =
    team.leader?._id?.toString() || team.leader?.toString(); // handles both populated + raw ObjectId

  const isLeader = memberId === leaderId;

  return (
    <div
      key={m._id}
      className="flex justify-between items-center bg-slate-800 p-2 rounded mb-2"
    >
      <span>{m.username || m.name}</span>

      {/* Leader badge */}
      {isLeader && (
        <span className="px-2 py-1 text-xs bg-red-600 text-white rounded">
          Leader
        </span>
      )}

      {/* Action buttons only for NON-leader members */}
      {!isLeader && (
        <div className="flex gap-2">
          <button
            onClick={() => removeUser(m._id)}
            className="px-2 py-1 bg-red-600 rounded text-xs"
          >
            Remove
          </button>

          <button
            onClick={() => transferLeadership(m._id)}
            className="px-2 py-1 bg-emerald-600 rounded text-xs"
          >
            Make Leader
          </button>
        </div>
      )}
    </div>
  );
})}


          {/* SEARCH + INVITE USERS */}
          {team.members.length< maxlength ? (
            <>
          <h3 className="mt-6 font-semibold text-lg">Invite Players</h3>

          <input
            className="w-full bg-slate-900 p-2 rounded border mt-2"
            placeholder="Search by username or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchResults.length > 0 && (
            <div className="mt-2 bg-slate-800 rounded-lg p-2 max-h-48 overflow-y-auto">
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  className="p-2 hover:bg-slate-700 rounded-md flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-semibold">{u.username}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>

                  <button
                    onClick={() => inviteUser(u._id)}
                    className="px-2 py-1 bg-blue-600 text-xs rounded"
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
           
      )
  :(
  <h2 className="text-lg mt-4 mb-2 font-semibold">Cant add more member (limit reached)</h2>
      )}
      
        </>
  )
}
</div>
)
}

