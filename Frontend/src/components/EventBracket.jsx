import React,{useEffect,useState} from "react";
import axios from "axios";
import {useParams} from "react-router-dom";
import {jwtDecode} from "jwt-decode";

export default function EventBracket(){
  const {eventId}=useParams();
  const [stages,setStages]=useState([]);

  const auth=()=>{
    const token=localStorage.getItem("accessToken");
    return {headers:{Authorization:`Bearer ${token}`}};
  };

  useEffect(()=>{
    axios.get(
  `http://localhost:5005/events/${eventId}/stages`,
  auth()
).then(res=>setStages(res.data));
    
  },[eventId]);

  const card="bg-slate-800/60 border border-slate-700 rounded-xl p-4";

  return(
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Tournament Bracket</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {stages.map(stage=>(
          <div key={stage._id} className={card}>
            <h2 className="text-lg font-semibold mb-3">
              {stage.name}
            </h2>

            {stage.matches.map(m=>(
              <div
                key={m._id}
                className="p-3 mb-3 bg-slate-700/50 rounded-lg"
              >
                <p className="text-sm">
                  {m.teamA?.teamId?.teamname || "TBD"}
                  {" vs "}
                  {m.teamB?.teamId?.teamname || "TBD"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Status: {m.status}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
