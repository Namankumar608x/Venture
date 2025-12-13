import mongoose from "mongoose";

const clubSchema=new mongoose.Schema({
  name:{type:String,required:true,trim:true},
  description:{type:String,default:"",trim:true},

  admin:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},

  managers:[{type:mongoose.Schema.Types.ObjectId,ref:"User",default:[]}],

  events:[{type:mongoose.Schema.Types.ObjectId,ref:"Event",default:[]}],
  users:[{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}]
},{timestamps:true});

const clubModel=mongoose.model("Club",clubSchema);
export default clubModel;
