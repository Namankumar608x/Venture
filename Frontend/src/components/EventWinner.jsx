import React,{useEffect,useState} from "react";
import axios from "axios";
import {useParams} from "react-router-dom";

export default function EventWinner(){
  const {eventId}=useParams();
  const [winner,setWinner]=useState(null);

  const auth=()=>({
    headers:{Authorization:`Bearer ${localStorage.getItem("accessToken")}`}
  });

  useEffect(()=>{
    axios.get(
      `http://localhost:5005/events/${eventId}`,
      auth()
    ).then(res=>setWinner(res.data.event.winnerTeam));
  },[eventId]);

  return(
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <div className="bg-slate-800 p-10 rounded-xl border border-slate-700 text-center">
        <h1 className="text-3xl font-bold mb-4">🏆 Champion</h1>
        <p className="text-xl text-emerald-400">
          {winner?.teamname}
        </p>
      </div>
    </div>
  );
}
