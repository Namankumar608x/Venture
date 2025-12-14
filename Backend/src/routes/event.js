import express from "express";
import User from "../models/user.js";
import Club from "../models/club.js";
import Event from "../models/events.js";
import authenticate from "../middlewares/auth.js";
import Match from "../models/matches.js";
import mongoose from "mongoose";
import Team from "../models/team.js";
import Schedule from "../models/schedule.js";
import {checkadmin,checkmanager} from "../middlewares/roles.js";
import QueryMessage from "../models/QueryMessage.js";
const router=express.Router();
const checkEvent = async (eventId) => {
  return await Event.findById(eventId);
};

router.post("/new",authenticate,async(req,res)=>{
const userid=req.user.id;
const {clubid,name,description,maxPlayer,status,teamc}=req.body;
try {
    const check=await Club.findById(clubid);//club exist karta hai ya nahi
if(!check){
    return res.status(404).json({message:"No club found!"});
}
if (check.admin.toString()===userid || check.managers.map(id=>id.toString()).includes(userid)){
    const event=new Event({name,admin:[userid],club:clubid,description,maxPlayer,status,teamsBy:teamc});
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
// router.post("/promote", authenticate, checkadmin, async (req, res) => {
//   try {
//     console.log("/promote route hit");
//     const { userid, post, eventid } = req.body;

//     if (!userid || !post)
//       return res.status(400).json({ message: "Missing data" });

//     let user;

//     // If userid is a valid ObjectId → search by _id
//     if (mongoose.Types.ObjectId.isValid(userid)) {
//       user = await User.findById(userid);
//     } 
//     else {
//       // Otherwise, treat it as username OR email
//       user = await User.findOne({
//         $or: [{ email: userid }, { username: userid }]
//       });
//     }

//     if (!user)
//       return res.status(404).json({ message: "User does not exist" });

//     // Update role
//     user.role = post;
//     await user.save();

//     return res.json({ message: "User promoted successfully", user });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });
router.post("/promote",authenticate,checkmanager,async(req,res)=>{
const adminid=req.user.id;
const {userid,eventid,post}=req.body;
try {
    const check=await User.findById(userid);
  if(!check) return res.status(404).json({message:"No user found!"})

const event=await Event.findById(eventid);

  if (!event) return res.status(404).json({ message: "Event not found" });
  const clubid=event.club;
  const club=await Club.findById(clubid);
 if (!check.clubs.map(id => id.toString()).includes(clubid.toString())){
  check.clubs.push(clubid);
  await check.save();

 }
   
  
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

router.post("/new-schedule",authenticate,async(req,res)=>{
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



//get routes-
router.get("/club/:clubId", authenticate, async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId).populate("events");

    if (!club) return res.status(404).json({ message: "Club not found" });

    return res.status(200).json({
      club: club.name,
      events: club.events
    });
  } catch (error) {
    console.error("GET /events/club/:clubId", error);
    return res.status(500).json({ message: "Server error" });
  }
});
// GET: events user created or joined
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await Event.find({
      $or: [
        { admin: userId },
        { managers: userId },
        { players: userId }
      ]
    });

    return res.status(200).json({ events });
  } catch (error) {
    console.error("GET /events", error);
    return res.status(500).json({ message: "Server error" });
  }
});
router.get("/:eventId/teams", authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("teams");

    if (!event) return res.status(404).json({ message: "Event not found" });

    return res.status(200).json({ teams: event.teams });
  } catch (error) {
    console.error("GET /events/:eventId/teams", error);
    return res.status(500).json({ message: "Server error" });
  }
});
router.get("/:eventId/schedules", authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) return res.status(404).json({ message: "Event not found" });

    const schedules=await Schedule.find({eventid:eventId});
    return res.status(200).json(schedules);
  } catch (error) {
    console.error("GET /events/:eventId/schedules", error);
    return res.status(500).json({ message: "Server error" });
  }
});
 router.get("/club/:clubId", authenticate, async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId).populate("events");

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    return res.status(200).json({
      club: club.name,
      events: club.events
    });
  } catch (error) {
    console.error("GET /events/club/:clubId error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});



router.get("/roles/:eventid", authenticate, async (req, res) => {
  try {
    const eventid = req.params.eventid;

    const event = await Event.findById(eventid).populate("admin managers", "username email name");
    if (!event) return res.status(404).json({ message: "Event not found" });

    return res.json({
      admins: event.admin || [],
      managers: event.managers || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/:eventId", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const event = await Event.findById(req.params.eventId)
      .populate("teams")

    if (!event) return res.status(404).json({ message: "Event not found" });

    // Check roles
    let isAdmin = event.admin?.map(id => id.toString()).includes(userId);

let isManager = event.managers?.map(id => id.toString()).includes(userId);


    res.json({
      event,
      role: isAdmin ? "admin" : isManager ? "manager" : "participant",
      
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// -------------------
// PRIVATE QUERY ROUTES (GET + POST)
// -------------------



// GET: fetch queries for an event
router.get("/:eventId/queries", authenticate, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user?.id || req.user?._id;

    console.log("[routes:event] GET /:eventId/queries user:", userId);

    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    const uid = String(userId);

    const isEventAdmin = Array.isArray(event.admin)
      ? event.admin.map(String).includes(uid)
      : event.admin?.toString() === uid;

    const isManager = Array.isArray(event.managers)
      ? event.managers.map(String).includes(uid)
      : false;

    let query = { eventId };

    if (!(isEventAdmin || isManager)) {
      // participant view → private only
      query = {
        eventId,
        $or: [{ sender: uid }, { targetUser: uid }],
        visibility: "private",
      };
    }

    const items = await QueryMessage.find(query)
      .sort({ createdAt: 1 })
      .populate("sender", "username name")
      .lean();

    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("[routes:event] GET queries error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

// POST: create query (fallback when socket unavailable)
router.post("/:eventId/queries", authenticate, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const message = (req.body?.message || "").trim();
    const userId = req.user?.id || req.user?._id;

    console.log("[routes:event] POST /:eventId/queries body:", req.body);

    if (!message) return res.status(400).json({ success: false, error: "Message required" });

    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    const uid = String(userId);

    const isEventAdmin = Array.isArray(event.admin)
      ? event.admin.map(String).includes(uid)
      : event.admin?.toString() === uid;

    const isManager = Array.isArray(event.managers)
      ? event.managers.map(String).includes(uid)
      : false;

    let isParticipant = true;
    if (Array.isArray(event.participants)) {
      isParticipant = event.participants.map(String).includes(uid);
    }

    if (!isParticipant && !isEventAdmin && !isManager) {
      console.warn("[routes:event] unauthorized POST query", uid);
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const senderRole = isEventAdmin || isManager ? "event-admin" : "participant";
    const visibility = "private";
    const targetUser = senderRole === "participant" ? uid : req.body.targetUser || null;

    const q = await QueryMessage.create({
      eventId,
      sender: uid,
      senderRole,
      message,
      visibility,
      targetUser,
      replyTo: req.body.replyToId || null,
    });

    const populated = await QueryMessage.findById(q._id)
      .populate("sender", "username name")
      .lean();

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error("[routes:event] POST queries error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;