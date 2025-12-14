import React,{useEffect,useState} from "react";
import axios from "axios";
import {useParams} from "react-router-dom";

export default function MatchControl(){
  const {matchId}=useParams();
  const [match,setMatch]=useState(null);
  const [winner,setWinner]=useState("");

  const auth=()=>({
    headers:{Authorization:`Bearer ${localStorage.getItem("accessToken")}`}
  });

  useEffect(()=>{
    axios.get(
      `http://localhost:5005/matches/${matchId}`,
      auth()
    ).then(res=>setMatch(res.data));
  },[matchId]);

  const updateStatus=async()=>{
    await axios.put(
      `http://localhost:5005/events/matches/${matchId}/status`,
      {status:"finished"},
      auth()
    );
    alert("Match finished");
  };

  const declareWinner=async()=>{
    await axios.put(
      `http://localhost:5005/events/${matchId}/result`,
      {winnerTeamId:winner},
      auth()
    );
    alert("Winner declared");
  };

  if(!match) return null;

  const card="bg-slate-800 border border-slate-700 rounded-xl p-5";

  return(
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className={card}>
        <h2 className="text-xl font-bold mb-4">Match Control</h2>

        <p className="mb-2">
          {match.teamA?.teamId?.teamname} vs {match.teamB?.teamId?.teamname}
        </p>

        <p className="text-sm text-slate-400 mb-4">
          Status: {match.status}
        </p>

        <button
          onClick={updateStatus}
          className="px-4 py-2 bg-yellow-600 rounded-lg mr-3"
        >
          Finish Match
        </button>

        <select
          onChange={e=>setWinner(e.target.value)}
          className="bg-slate-700 p-2 rounded-lg mr-2"
        >
          <option value="">Select Winner</option>
          <option value={match.teamA.teamId._id}>
            {match.teamA.teamId.teamname}
          </option>
          <option value={match.teamB.teamId._id}>
            {match.teamB.teamId.teamname}
          </option>
        </select>

        <button
          onClick={declareWinner}
          className="px-4 py-2 bg-emerald-600 rounded-lg"
        >
          Declare Winner
        </button>
      </div>
    </div>
  );
}
