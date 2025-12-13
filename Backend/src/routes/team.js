import express from "express";
import User from "../models/user.js";
import Event from "../models/events.js";
import authenticate from "../middlewares/auth.js";
import Team from "../models/team.js";
import mongoose from "mongoose";

const router = express.Router();

const checkEvent = async (eventId) => Event.findById(eventId);

router.get("/team/notifications", authenticate, async (req, res) => {
  try {
    const userid = req.user.id;

    const user = await User.findById(userid)
      .populate("notifications.requser", "name username email")
      .populate("notifications.teamid", "teamname");

    if (!user || user.notifications.length === 0)
      return res.status(200).json({ notifications: [] });

    const notifications = user.notifications.map((n) => ({
      id: n._id,
      message: n.message,
      userName: n.requser?.name,
      teamName: n.teamid?.teamname,
      requser: n.requser?._id,
      teamid: n.teamid?._id,
      createdAt: n.createdAt,
    }));

    return res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/team/:teamid/",async(req,res)=>{
  try {
    const {teamid}=req.params;
    
    const teams=await Team.findById(teamid).populate("leader", "name username email")
      .populate("members", "name username email")
      .populate("requests.user", "name username email");
       
      return res.status(200).json(teams);
  } catch (error) {
     console.error(error);
    res.status(500).json({ message: "Server error" });
  }

});
router.get("/:eventid/",async(req,res)=>{
  try {
    const {eventid}=req.params;
const event = await checkEvent(eventid);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const teams=await Team.find({eventid}).populate("leader", "name username email")
      .populate("members", "name username email")
      .populate("requests.user", "name username email");
       
      return res.status(200).json(teams);
  } catch (error) {
     console.error(error);
    res.status(500).json({ message: "Server error" });
  }

});


/* ---------------------------------------------------
   CREATE TEAM
--------------------------------------------------- */
router.post("/new-team", authenticate, async (req, res) => {
  try {
    const adminid = req.user.id;
    const { teamname, eventid } = req.body;

    const event = await checkEvent(eventid);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const existingTeam = await Team.findOne({
      eventid,
      $or: [{ leader: adminid }],
    });

    if (existingTeam){
       console.log("you are already in a team");
             return res.status(400).json({
   
        message: "You are already part of a team in this event",
      });

    }

      console.log("new team created");
    const team = new Team({ teamname, leader: adminid, eventid });
    team.members.push(adminid);

    const saved = await team.save();

    event.teams.push(saved._id);
    await event.save();

    return res.status(200).json({ message: "new team created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------------
   JOIN REQUEST
--------------------------------------------------- */
router.post("/invite", authenticate, async (req, res) => {
  try {
    const { teamid, userid } = req.body;
    const adminid = req.user.id;

    const team = await Team.findById(teamid);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.leader.toString() !== adminid)
      return res.status(403).json({ message: "Only leader can invite" });

    if (team.members.some(id => id.toString() === userid.toString()))
      return res.status(400).json({ message: "User already a member" });

    if (team.requests.some(r => r.user.toString() === userid.toString()))
      return res.status(400).json({ message: "Already invited" });

    team.requests.push({ user: userid });
    await team.save();

    const user = await User.findById(userid);
    user.notifications.push({
      message: `You were invited to join team "${team.teamname}"`,
      requser: adminid,
      teamid: team._id,
    });

    await user.save();

    res.json({ message: "Join invite sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



// --------------------------------------------------- */
// POST /team/accept-request
router.post("/team/accept-request", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const note = user.notifications.id(notificationId);
    if (!note) return res.status(404).json({ message: "Notification not found" });

    const team = await Team.findById(note.teamid);
    if (!team) return res.status(404).json({ message: "Team not found" });
  const eventid=team.eventid;
  const event=await Event.findById(eventid);
  
   if (!team.members.some(m => m.toString() === userId)) {
      team.members.push(userId);
    }
    if (!user.events.some(e => e.toString() === event._id.toString())) {
      user.events.push(event._id);
    }
    if (event.club && !user.clubs.some(c => c.toString() === event.club.toString())){
      user.clubs.push(event.club);
    }
    note.deleteOne();

    await user.save();
    await team.save();

    res.json({ message: "Joined team successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------------
   REJECT REQUEST
--------------------------------------------------- */
router.post("/team/reject-request", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const note = user.notifications.id(notificationId);
    if (!note) return res.status(404).json({ message: "Notification not found" });

    note.deleteOne();
    await user.save();

    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/remove",authenticate,async(req,res)=>{
  try {
     const leaderId=req.user.id;
     const {teamid,userid}=req.body;
     const team=await Team.findById(teamid);
     if (!team)
      return res.status(404).json({ message: "Team not found" });

       if (team.leader.toString() !== leaderId)
      return res.status(403).json({ message: "Only leader can remove"});
 if (userid.toString() === leaderId)
      return res.status(400).json({ message: "Leader cannot remove himself" });

     const user=await User.findById(userid);
     if (user) {
      user.events.pull(team.eventid);
      await user.save();
     }
     if (!team.members.some(id => id.toString() === userid.toString())) {
      return res.status(400).json({ message: "User is not in team" });
    }
    team.members.pull(userid);
     await team.save();
     return res.status(200).json({message:"User removed from team"});
  } catch (error) {
      console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/make-admin", authenticate, async (req, res) => {
  try {
    const leaderId = req.user.id;
    const { teamid, userid } = req.body;

    const team = await Team.findById(teamid);
    if (!team)
      return res.status(404).json({ message: "Team not found" });

    // 1. Only current leader can do this
    if (team.leader.toString() !== leaderId)
      return res.status(403).json({ message: "Only leader can assign admin" });

    // 2. Cannot assign self
    if (userid.toString() === leaderId)
      return res.status(400).json({ message: "You are already the admin" });

    // 3. New admin must be a member
    if (!team.members.some(id => id.toString() === userid.toString())) {
      return res.status(400).json({ message: "User is not a team member" });
    }

    // 4. Transfer leadership
    team.members.pull(userid);       // remove from members
    team.members.push(leaderId);     // old leader becomes member
    team.leader = userid;            // new leader

    await team.save();

    res.status(200).json({
      message: "Admin role transferred successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
