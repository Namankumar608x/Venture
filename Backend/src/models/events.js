import mongoose from "mongoose";

const eventSchema=new mongoose.Schema({
      name:{type:String,required:true},
  admin:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  coordinator:[{type:mongoose.Schema.Types.ObjectId,ref:"User",default:[]}],
  managers:[{type:mongoose.Schema.Types.ObjectId,ref:"User",default:[]}],
  players:[{type:mongoose.Schema.Types.ObjectId,ref:"User",default:[]}],
  club:{type:mongoose.Schema.Types.ObjectId,ref:"Club",required:true},
},{timestamps:true});

const eventModel=mongoose.model("Event",eventSchema);
export default eventModel;
