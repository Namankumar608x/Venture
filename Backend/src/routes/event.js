import express from "express";
import User from "../models/user.js";
import Club from "../models/club.js";
import Event from "../models/events.js";
import authenticate from "../middlewares/auth.js";
import {checkadmin,checkmanager} from "../middlewares/roles.js";

const router=express.Router();

router.post("/new",authenticate,async(req,res)=>{
const userid=req.user.id;
const {clubid,eventname}=req.body;
try {
    const check=await Club.findById(clubid);//club exist karta hai ya nahi
if(!check){
    return res.status(404).json({message:"No club found!"});
}
if (check.admin.toString()===userid || check.managers.map(id=>id.toString()).includes(userid)){
    const event=new Event({name: eventname,admin:[userid],club:clubid});
    const newevent=await event.save();
    check.events.push(newevent._id);
    const user=await User.findById(userid);
    user.events.push(newevent._id);
    await user.save();
    await check.save();
    return res.status(200).json({message:"event created",eventId: newevent._id});
}
else{
    return res.status(401).json({message:"Unauthorized"});
}
} catch (error) {
     console.error(error);
    return res.status(500).json({ error: "Server error occurred!" });
}

});


router.post("/promote",authenticate,async(req,res)=>{
const adminid=req.user.id;
const {userid,eventid,post}=req.body;
try {
    const check=await User.findById(userid);
  if(!check) return res.status(404).json({message:"No user found!"})

const event=await Event.findById(eventid);

  if (!event) return res.status(404).json({ message: "Event not found" });
  const clubid=event.club;
 if (!check.clubs.map(id => id.toString()).includes(clubid.toString()))
    return res.status(401).json({ message: "Unauthorized" });
  
  if (!event.admin.map(id => id.toString()).includes(adminid))
      return res.status(401).json({ message: "Unauthorized" });
if(post==="admin"){
    if(event.admin.length>=2) return res.status(400).json({message:"Can't make more than 2 admins"});
    if (!event.admin.map(id => id.toString()).includes(userid)) {
    event.admin.push(userid);
    check.events.push(eventid);
    await event.save();
    await check.save();
    return res.status(200).json({message:"new admin created"});
}

     
}
else{
   if (!event.managers.map(id => id.toString()).includes(userid)) {
    event.managers.push(userid);
    check.events.push(eventid);
    await check.save();
    await event.save();
   return res.status(200).json({message:"new manager created"});
}
else{
      return res.status(401).json({ message: "User is already a manager" });
}
     
    
}
} catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error occurred!" });
}

});
router.post("/updates",authenticate,checkmanager,async(req,res)=>{
try {
    const {userid}=req.user.id;
    const {eventid,message}=req.body;
    const event=await Event.findById(eventid);
    if (!event) return res.status(404).json({ message: "Event not found" });
    event.updates.push({
        message,
        createdBy:userid,
        })
        await event.save();
        return res.status(200).json({message:"Message emitted sucessfully"});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;