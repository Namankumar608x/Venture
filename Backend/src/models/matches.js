import mongoose from "mongoose";

const matchSchema=new mongoose.Schema({
eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  },

  teamA: {
    teamId: { type: mongoose.Schema.Types.ObjectId }, 
    score: Number
  },

  teamB: {
    teamId: { type: mongoose.Schema.Types.ObjectId }, 
    score: Number
  },
  
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
  }, time:{type:String}

},{timestamps:true});

const matchModel=mongoose.model("Matches",matchSchema);
export default matchModel;
