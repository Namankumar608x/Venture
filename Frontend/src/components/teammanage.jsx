import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import axios from "axios";
import axiosInstance from "../utils/axiosInstance";
export default function TeamManagePage() {
  const {clubid, eventId, teamid } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [maxlength, setMaxlength] = useState(1);
  const [editingName, setEditingName] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [currentUser, setCurrentUser] = useState("");

  /* -----------------------------------------------------------
        FETCH EVENT
  ------------------------------------------------------------ */
  const fetchEvent = async () => {
    const res = await api.get(`/events/${eventId}`);
    setMaxlength(res.data.event.maxPlayer);
    console.log(maxlength);
  };

  /* -----------------------------------------------------------
        FETCH TEAM
  ------------------------------------------------------------ */
  const fetchTeam = async () => {
    const res = await api.get(`/teams/team/${teamid}`);
    setTeam(res.data);
    setNewTeamName(res.data.teamname);
  };

  /* -----------------------------------------------------------
        AUTH
  ------------------------------------------------------------ */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUser(payload.id);
    }
  }, []);

  useEffect(() => {
    fetchEvent();
    fetchTeam();
  }, []);

  /* -----------------------------------------------------------
        SEARCH USERS
  ------------------------------------------------------------ */
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const res = await api.post("/auth/search-users", {
          q: searchQuery,
        });
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  /* -----------------------------------------------------------
        TEAM ACTIONS
  ------------------------------------------------------------ */

  const inviteUser = async (userid) => {
    await api.post("/teams/invite", { teamid, userid });
    alert("Invite sent");
  };

  const removeUser = async (userid) => {
    await api.post("/teams/remove", { teamid, userid });
    fetchTeam();
  };

  const makeLeader = async (userid) => {
    await api.post("/teams/make-admin", { teamid, userid });
    fetchTeam();
  };

  const updateTeamName = async () => {
    await api.put("/teams/edit", { teamid, name: newTeamName });
    setEditingName(false);
    fetchTeam();
  };

  const dismantleTeam = async () => {
    if (!window.confirm("This will permanently delete the team. Continue?"))
      return;

    await api.post("/teams/dismantle", { teamid });
    navigate(`/events/${eventId}`);
  };

  const leaveTeam = async () => {
    try {
      await axiosInstance.post(
        "/teams/leave",
        { teamid },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      navigate(`/events/${eventId}`);
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };
  if(!team) return null;
const isMember = team.members.some(
  (m) => m._id.toString() === currentUser
) || false;
  const proceedToRegister = async () => {
    try {
      const ok = window.confirm(
      "⚠️ Final Registration Warning\n\nAfter proceeding:\n• Team cannot be edited\n• Members cannot be changed\n\nContinue?"
    );
    if (!ok) return;

    const res = await api.post("/teams/register", { teamid });
    if(res.status===200){
      console.log("response is ok");
       navigate(`/events/${clubid}/${eventId}`);
    }
    } catch (error) {
      console.log(error);
    }
    
   
  };

  if (!team) return null;

  const leaderId =
    team.leader?._id?.toString() || team.leader?.toString();
  const isLeader = leaderId === currentUser;
  const isRegistered = team.isRegistered;

  return (
    <div className="p-6 text-white">

      {/* TEAM HEADER */}
      <div className="flex justify-between items-center">
        {editingName ? (
          <div className="flex gap-2">
            <input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="bg-slate-900 p-2 rounded"
            />
            <button
              onClick={updateTeamName}
              className="bg-green-600 px-3 rounded"
            >
              Save
            </button>
          </div>
        ) : (
          <h1 className="text-2xl font-bold">{team.teamname}</h1>
        )}

        {!isRegistered && isLeader && (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm text-blue-400"
          >
            Edit Name
          </button>
        )}
      </div>

      <p className="text-slate-400">
        Leader: {team.leader?.username || team.leader?.name}
      </p>

      {/* MEMBERS */}
      <h2 className="mt-4 font-semibold">
        Members ({team.members.length}/{maxlength})
      </h2>

      {team.members.map((m) => {
        const memberId = m._id.toString();
        const memberIsLeader = memberId === leaderId;

        return (
          <div
            key={m._id}
            className="bg-slate-800 p-2 rounded flex justify-between mt-2"
          >
            <span>{m.username || m.name}</span>

            {!isRegistered && isLeader && !memberIsLeader && (
              <div className="flex gap-2">
                <button
                  onClick={() => removeUser(m._id)}
                  className="bg-red-600 px-2 text-xs rounded"
                >
                  Remove
                </button>
                <button
                  onClick={() => makeLeader(m._id)}
                  className="bg-emerald-600 px-2 text-xs rounded"
                >
                  Make Leader
                </button>
              </div>
            )}

            {memberIsLeader && (
              <span className="text-xs bg-red-600 px-2 rounded">
                Leader
              </span>
            )}
          </div>
        );
      })}

      {/* INVITE USERS */}
      {!isRegistered && isLeader && team.members.length < maxlength && (
        <>
          <h3 className="mt-6 font-semibold">Invite Players</h3>
          <input
            className="bg-slate-900 p-2 w-full rounded mt-2"
            placeholder="Search users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchResults.map((u) => (
            <div
              key={u._id}
              className="flex justify-between mt-2 bg-slate-800 p-2 rounded"
            >
              <span>{u.username}</span>
              <button
                onClick={() => inviteUser(u._id)}
                className="bg-blue-600 px-2 rounded text-xs"
              >
                Invite
              </button>
            </div>
          ))}
        </>
      )}

      {/* FINAL ACTIONS */}
      {!isRegistered && (
        <div className="mt-8 flex gap-4">
          {isLeader ? (
            <>
              <button
                onClick={proceedToRegister}
                className="bg-purple-600 px-4 py-2 rounded"
              >
                Proceed to Register
              </button>

              <button
                onClick={dismantleTeam}
                className="bg-red-700 px-4 py-2 rounded"
              >
                Dismantle Team
              </button>
            </>
          ) : isMember && (
            <button
              onClick={leaveTeam}
              className="bg-red-600 px-4 py-2 rounded"
            >
              Leave Team
            </button>
          )}
        </div>
      )}

      {isRegistered && (
        <p className="mt-6 text-green-400">
          ✅ Team successfully registered. Changes are locked.
        </p>
      )}
    </div>
  );
}
