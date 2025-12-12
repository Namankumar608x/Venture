import express from "express";
import User from "../models/user.js";
import Club from "../models/club.js";
import Event from "../models/events.js";
import authenticate from "../middlewares/auth.js";
import Match from "../models/matches.js";
import Team from "../models/team.js";
import mongoose from "mongoose";

import ChatMessage from "../models/ChatMessage.js";
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
  } catch (error) {
    console.error(error);
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
    console.error(error);
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
    console.error(error);
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
      console.error(error);
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
      console.error(error);
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
router.get("/:eventId/chat", authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);

    const skip = (page - 1) * limit;

    const messages = await ChatMessage.find({ event: eventId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username name");

    // send in chronological order (oldest first)
    return res.json({
      success: true,
      data: messages.reverse(),
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /event/:id/chat error:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * POST /event/:eventId/chat
 * Create an announcement (ONLY event admins OR club admins)
 * Body: { message: "..." }
 */
// POST /:eventId/chat — create announcement (event admin OR club admin)
router.post("/:eventId/chat", authenticate, async (req, res) => {
  const { eventId } = req.params;
  const { message } = req.body;
  const userId = req.user && (req.user.id || req.user._id);

  try {
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: "Message required" });
    }

    // Debug log
    console.log("CHAT POST called for eventId:", eventId, "by user:", userId);

    const event = await Event.findById(eventId);
    if (!event) {
      console.warn("CHAT POST: event not found:", eventId);
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    // Check event admin
    const isEventAdmin = Array.isArray(event.admin)
      ? event.admin.some((id) => id.toString() === userId?.toString())
      : event.admin?.toString() === userId?.toString();

    // Check club admin (if event has club)
    let isClubAdmin = false;
    if (event.club) {
      const club = await Club.findById(event.club);
      if (club && club.admin) {
        isClubAdmin = club.admin.toString() === userId?.toString();
      }
    }

    if (!isEventAdmin && !isClubAdmin) {
      console.warn("CHAT POST: unauthorized user:", userId, "isEventAdmin:", isEventAdmin, "isClubAdmin:", isClubAdmin);
      return res.status(403).json({ success: false, error: "Only event or club admins can post announcements" });
    }

    const chat = new ChatMessage({
      event: eventId,
      sender: userId,
      message: message.trim(),
    });

    const saved = await chat.save();

    // Populate robustly (avoid execPopulate issues)
    const populated = await ChatMessage.findById(saved._id).populate("sender", "username name").lean();

    // Emit to socket room, if io available
    try {
      const io = req.app?.locals?.io;
      if (io) {
        io.to(`event:${eventId}`).emit("chat:new", populated);
        console.log("EMIT chat:new to room:", `event:${eventId}`, "payload id:", populated?._id);
      } else {
        console.warn("EMIT skipped: io not found on req.app.locals.io");
      }
    } catch (emitErr) {
      console.error("EMIT ERROR:", emitErr);
    }

    return res.json({ success: true, data: populated });
  } catch (err) {
    // Detailed error logging for debugging
    console.error("ERROR in POST /event/:eventId/chat:", err, err.stack);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});


/**
 * PUT /event/:eventId/score
 * Admin/Manager updates score for a match
 * Body: { matchId, scoreA, scoreB }
 */
router.put("/:eventId/score", authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { matchId, scoreA, scoreB } = req.body;
    const userId = req.user && req.user.id ? req.user.id : req.user._id;

    if (!matchId) return res.status(400).json({ success: false, error: "matchId required" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    const isAdmin = event.admin && event.admin.some(id => id.toString() === userId.toString());
    const isManager = event.managers && event.managers.some(id => id.toString() === userId.toString());

    if (!isAdmin && !isManager) {
      return res.status(403).json({ success: false, error: "Only event admins or managers can update scores" });
    }

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, error: "Match not found" });

    // Update scores — adapt field names to your Match model
    match.scoreA = typeof scoreA !== "undefined" ? scoreA : match.scoreA;
    match.scoreB = typeof scoreB !== "undefined" ? scoreB : match.scoreB;
    match.lastUpdatedBy = userId;
    match.updatedAt = new Date();

    const saved = await match.save();

    // Emit via socket to event room
    try {
      const io = req.app.locals.io;
      if (io) {
        io.to(`event:${eventId}`).emit("score:updated", {
          matchId: saved._id,
          scoreA: saved.scoreA,
          scoreB: saved.scoreB,
          updatedAt: saved.updatedAt || new Date(),
        });
      }
    } catch (emitErr) {
      console.warn("Failed to emit score:updated", emitErr);
    }

    return res.json({ success: true, data: saved });
  } catch (err) {
    console.error("PUT /event/:id/score error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;