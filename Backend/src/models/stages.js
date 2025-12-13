import mongoose from "mongoose";

const stageSchema = new mongoose.Schema({

  eventid:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Event",
    required:true
  },

  name:{
    type:String,
    required:true
    // "Preliminary", "Quarter Final", "League Stage", "Final"
  },

  type:{
    type:String,
    enum:["KNOCKOUT","LEAGUE"],
    required:true
  },

  order:{
    type:Number,
    required:true
  },

  teams:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Team"
  }],

  matches:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Matches"
  }],

  status:{
    type:String,
    enum:["pending","ongoing","completed"],
    default:"pending"
  }

},{timestamps:true});

const Stage = mongoose.model("Stage", stageSchema);
export default Stage;
