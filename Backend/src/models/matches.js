import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({

  eventid:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Event",
    required:true
  },

  // 🔴 ADD: link match to a stage (round)
  stageid:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Stage",
    required:true
  },

  // 🔴 ADD: helps logic split
  matchType:{
    type:String,
    enum:["KNOCKOUT","LEAGUE"],
    required:true
  },

  status:{
    type:String,
    enum:["upcoming","live","finished"],
    default:"upcoming"
  },

  teamA:{
    teamId:{type:mongoose.Schema.Types.ObjectId,ref:"Team"},
    score:{type:Number,default:0}
  },

  teamB:{
    teamId:{type:mongoose.Schema.Types.ObjectId,ref:"Team"},
    score:{type:Number,default:0}
  },

  // 🔴 ADD: winner for auto-advancement
  winner:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Team",
    default:null
  },

  // 🔴 ADD: football draw handling
  isDraw:{
    type:Boolean,
    default:false
  },

  // 🔴 ADD: penalty decision support
  decidedBy:{
    type:String,
    enum:["NORMAL","PENALTY"],
    default:"NORMAL"
  },

  scheduleid:{
    type:mongoose.Schema.Types.ObjectId
  },

  time:{type:String}

},{timestamps:true});

const Match = mongoose.model("Matches", matchSchema);
export default Match;
