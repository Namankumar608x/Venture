import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
  username:{type:String,required:true,unique:true,trim:true},
  name:{type:String,required:true,trim:true},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  password:{type:String,required:true},
  events:[{type:mongoose.Schema.Types.ObjectId,ref:"Event",default:[]}],
  clubs:[{type:mongoose.Schema.Types.ObjectId,ref:"Club",default:[]}],
  currentRefreshToken:{type:String,default:null},
  roll_number:{type:String},
   isVerified: { type: Boolean, default: false },
  gender:{type:String},
  notifications: [
  {
    message: String,
    requser:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    teamid:{type:mongoose.Schema.Types.ObjectId,ref:"Team"},
    createdAt: { type: Date, default: Date.now }
  }
],
},{timestamps:true});

const userModel=mongoose.model("User",userSchema);
export default userModel;
