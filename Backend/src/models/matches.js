import mongoose from "mongoose";

const matchSchema=new mongoose.Schema({
eventid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  },
  status: {
  type: String,
  enum: ["upcoming", "live", "finished"],
  default: "upcoming"
},

  teamA: {
    teamId: { type: mongoose.Schema.Types.ObjectId }, 
    score: Number
  },

  teamB: {
    teamId: { type: mongoose.Schema.Types.ObjectId }, 
    score: Number
  },
  
  scheduleid: {
    type: mongoose.Schema.Types.ObjectId,
  }, time:{type:String}

},{timestamps:true});

const matchModel=mongoose.model("Matches",matchSchema);
export default matchModel;
