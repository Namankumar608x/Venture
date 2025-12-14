import React,{useEffect,useState} from "react";
import axios from "axios";
import {useParams,useNavigate} from "react-router-dom";

export default function EventMatches(){
  const {eventId}=useParams();
  const navigate=useNavigate();
  const [stages,setStages]=useState([]);

  const auth=()=>({
    headers:{Authorization:`Bearer ${localStorage.getItem("accessToken")}`}
  });

  useEffect(()=>{
    axios.get(
      `http://localhost:5005/stages/${eventId}`,
      auth()
    ).then(res=>setStages(res.data));
  },[eventId]);

  return(
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <h1 className="text-2xl font-bold mb-5">Matches</h1>

      {stages.map(stage=>(
        <div key={stage._id} className="mb-6">
          <h2 className="text-lg font-semibold mb-3">
            {stage.name}
          </h2>

          {stage.matches.map(m=>(
            <div
              key={m._id}
              onClick={()=>navigate(`match/${m._id}`)}
              className="p-3 mb-2 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700"
            >
              {m.teamA?.teamId?.teamname || "TBD"} vs{" "}
              {m.teamB?.teamId?.teamname || "TBD"}
              <span className="text-xs text-slate-400 ml-3">
                {m.status}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
