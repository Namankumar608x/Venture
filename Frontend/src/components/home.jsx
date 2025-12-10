import React,{useEffect,useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import {jwtDecode} from "jwt-decode";

function Home(){
  const [adminTournaments,setAdminTournaments]=useState([]);
  const [participantTournaments,setParticipantTournaments]=useState([]);
  const [newTournamentName,setNewTournamentName]=useState("");
  const [joinTournamentId,setJoinTournamentId]=useState("");
  const [message,setMessage]=useState("");
  const [isCreating,setIsCreating]=useState(false);
  const [isJoining,setIsJoining]=useState(false);

  const navigate=useNavigate();

  const getAuthConfig=()=>{
    const token=localStorage.getItem("accessToken");
    console.log("[getAuthConfig] token:", token);
    if(!token){
      setMessage("Please login again, session expired.");
      return null;
    }
    try{
      const payload = jwtDecode(token);
      if(payload.exp && Date.now()/1000 > payload.exp){
        localStorage.removeItem("accessToken");
        setMessage("Please login again, session expired.");
        return null;
      }
    }catch(e){
      console.warn("[getAuthConfig] jwt decode failed", e);
      localStorage.removeItem("accessToken");
      setMessage("Please login again, session expired.");
      return null;
    }
    return{
      headers:{
        Authorization:`Bearer ${token}`,
        "Content-Type":"application/json",
      },
    };
  };

  const fetchTournaments=async()=>{
    try{
      setMessage(""); // clear previous message
      const config=getAuthConfig();
      if(!config){
        console.log("[fetchTournaments] no config, aborting fetch");
        return;
      }

      console.log("[fetchTournaments] calling APIs with config", config);
      const [adminRes,participantRes]=await Promise.all([
       axios.get("http://localhost:5005/clubs/my-admin", config)
,
        axios.get("http://localhost:5005/clubs/participant",config),
      ]);

      setAdminTournaments(adminRes.data.tournaments||[]);
      setParticipantTournaments(participantRes.data.tournaments||[]);
    }catch(err){
      console.error("[fetchTournaments] error", err);
      setMessage(err.response?.data?.error||"Failed to load tournaments");
    }
  };

  useEffect(()=>{
    // ensure axios uses any stored token as default (optional)
    const tok = localStorage.getItem("accessToken");
    if(tok) axios.defaults.headers.common["Authorization"] = `Bearer ${tok}`;

    fetchTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleCreateTournament=async(e)=>{
    e.preventDefault();
    console.log("[handleCreateTournament] clicked");
    if(!newTournamentName.trim()){
      setMessage("Tournament name is required");
      return;
    }
    setIsCreating(true);
    setMessage("");
    try{
      const config=getAuthConfig();
      if(!config){
        console.log("[handleCreateTournament] missing config, aborting");
        setIsCreating(false);
        return;
      }
      const res=await axios.post(
        "http://localhost:5005/clubs/new",
        {name:newTournamentName.trim()},
        config
      );
      console.log("[handleCreateTournament] server response", res.data);
      setMessage("Tournament created successfully");
      setNewTournamentName("");
      fetchTournaments();
    }catch(err){
      console.error("[handleCreateTournament] error",err);
      setMessage(err.response?.data?.error||"Failed to create tournament");
    }finally{
      setIsCreating(false);
    }
  };

  const handleJoinTournament=async(e)=>{
    e.preventDefault();
    console.log("[handleJoinTournament] clicked");
    if(!joinTournamentId.trim()){
      setMessage("Tournament ID is required to join");
      return;
    }
    setIsJoining(true);
    setMessage("");
    try{
      const config=getAuthConfig();
      if(!config){
        console.log("[handleJoinTournament] missing config, aborting");
        setIsJoining(false);
        return;
      }
      const res=await axios.post(
        "http://localhost:5005/clubs/join",
        {clubId:joinTournamentId.trim()},
        config
      );
      console.log("[handleJoinTournament] server response", res.data);
      setMessage("Joined tournament successfully");
      setJoinTournamentId("");
      fetchTournaments();
    }catch(err){
      console.error("[handleJoinTournament] error",err);
      setMessage(err.response?.data?.error||"Failed to join tournament");
    }finally{
      setIsJoining(false);
    }
  };

  const handleLogout=()=>{
    localStorage.removeItem("accessToken");
    delete axios.defaults.headers.common["Authorization"];
    navigate("/login", { replace: true });
  };

  return(
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Ven<span className="text-blue-500">ture</span> Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Create or join tournaments and manage your sports journey.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm border border-slate-700 hover:bg-slate-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Main card */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create Tournament */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Create a Tournament
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                You will become the admin for this tournament.
              </p>

              <form onSubmit={handleCreateTournament} className="space-y-3">
                <input
                  type="text"
                  value={newTournamentName}
                  onChange={(e)=>setNewTournamentName(e.target.value)}
                  placeholder="Tournament name (e.g. Sports Fest 2025)"
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                >
                  {isCreating ? "Creating..." : "Create Tournament"}
                </button>
              </form>
            </div>

            {/* Join Tournament */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Enter Ongoing Tournament
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Enter using a tournament ID shared by the organizer.
              </p>

              <form onSubmit={handleJoinTournament} className="space-y-3">
                <input
                  type="text"
                  value={joinTournamentId}
                  onChange={(e)=>setJoinTournamentId(e.target.value)}
                  placeholder="Paste Tournament ID here"
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded-lg border border-slate-600 shadow-sm transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isJoining ? "Joining..." : "Join Tournament"}
                </button>
              </form>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className="mt-6">
              <div className="p-3 rounded-lg text-sm text-center bg-slate-800/70 border border-slate-700 text-slate-100">
                {message}
              </div>
            </div>
          )}

          {/* Lists */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {/* Admin tournaments */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Your Tournaments (Admin)
              </h3>
              {adminTournaments.length===0?(
                <p className="text-slate-500 text-sm">
                  You are not admin of any tournaments yet.
                </p>
              ):(
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {adminTournaments.map(t=>(
                    <div
                      key={t._id}
                      className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 flex justify-between items-center text-sm text-slate-100"
                    >
                      <div>
                        <div className="font-medium">
                          {t.name || "Unnamed Tournament"}
                        </div>
                        <div className="text-xs text-slate-400">
                          ID: {t._id}
                        </div>
                      </div>
                      {/* later this button can go to tournament dashboard */}
                      <button className="text-xs px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white">
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Participant tournaments */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Tournaments You Joined
              </h3>
              {participantTournaments.length===0?(
                <p className="text-slate-500 text-sm">
                  You haven't joined any tournaments yet.
                </p>
              ):(
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {participantTournaments.map(t=>(
                    <div
                      key={t._id}
                      className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 flex justify-between items-center text-sm text-slate-100"
                    >
                      <div>
                        <div className="font-medium">
                          {t.name || "Unnamed Tournament"}
                        </div>
                        <div className="text-xs text-slate-400">
                          ID: {t._id}
                        </div>
                      </div>
                      <button className="text-xs px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100">
                        View
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

export default Home;
