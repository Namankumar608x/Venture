import express from "express";
import User from "../models/user.js";
import Club from "../models/club.js";
import Event from "../models/events.js";
import authenticate from "../middlewares/auth.js";
import Match from "../models/matches.js";
import Team from "../models/team.js";

import {checkadmin,checkmanager} from "../middlewares/roles.js";

const checkEvent = async (eventId) => {
  return await Event.findById(eventId);
};

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
    const userid=req.user.id;
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
router.post("/new-schedule",authenticate,checkmanager,async(req,res)=>{
    try {
const {eventid,title,date,time,location,description}=req.body;
if(!eventid || !title || !date || !time || !location ) return res.status(400).json({ message: "Missing fields" });
const event=await Event.findById(eventid);
 if (!event) return res.status(404).json({ message: "Event not found" });
event.schedule.push({
   _id: new mongoose.Types.ObjectId(), title,date,time,location,description
});
await event.save();
return res.status(200).json({
    message:`New schedule for ${event.name} created `
});
    } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
    }


});
router.post("/join-event",authenticate,async(req,res)=>{
  try {
    const playerid=req.user.id;
    const {scheduleid,eventid}=req.body;
    const user=await User.findById(playerid);
const event=await Event.findById(eventid);
 if (!event)
      return res.status(404).json({ message: "Event not found" });

  if (event.players.map(id => id.toString()).includes(playerid)) return res.status(400).json({message:"player already in event"});
event.players.push(playerid);
await event.save();
user.events.push(eventid);
await user.save();
return res.status(200).json({message:"player added"});

  } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

});

router.post("/new-team",authenticate,async(req,res)=>{
  try {
    const adminid=req.user.id;
const {teamname,eventid}=req.body;
const event=await checkEvent(eventid);
if(!event) return res.status(404).json({ message: "Event not found" });
const team=new Team({
  teamname,
  leader:adminid,
  
  eventid
});
team.members.push(adminid);
const fteam=await team.save();
event.teams.push(fteam._id);
await event.save();
return res.status(200).json({message:"new team created"});
  } catch (error) {
      console.error(err);
    res.status(500).json({ message: "Server error" });
  }


});

router.post("/add-team_member",authenticate,async(req,res)=>{
try {
  const adminid=req.user.id;
  const {userid,teamid}=req.body;

  const team=await Team.findById(teamid);
  if(!team) return res.status(404).json({ message: "team not found" });
    if(team.leader.toString()!==adminid) return res.status(400).json({message:"only leader can add members"});
   if (team.members.map(id => id.toString()).includes(userid)) {
      return res.status(400).json({ message: "User already a member of this team" });
    }
const event = await Event.findById(team.eventid);
if (!event.players.map(id => id.toString()).includes(userid.toString()))
    return res.status(400).json({ message: "User must join event first" });
  team.members.push(userid);
  await team.save();
  return res.status(200).json({message:"new member added to team"});
} catch (error) {
      console.error(err);
    res.status(500).json({ message: "Server error" });
}
});



router.post("/match/create",authenticate,checkmanager, async (req, res) => {
  const { eventid, teamA, teamB, scheduleid,time} = req.body;
  const event = await Event.findById(eventid);
if (!event) return res.status(404).json({ message: "Event not found" });

const teamIds = event.teams.map(id => id.toString());
if (!teamIds.includes(teamA.toString()) || !teamIds.includes(teamB.toString()))
  return res.status(400).json({ message: "Teams not part of event" });


const schedule = event.schedule.id(scheduleid);
if (!schedule) return res.status(400).json({ message: "Schedule not part of event" });
  const match = await Match.create({
    eventid,
    scheduleid,
    teamA: { teamId: teamA },
    teamB: { teamId: teamB },
    time
  });


  res.json({ message: "Match created", match });
});




export default router;