import express from "express";
import User from "../models/user.js";
import Event from "../models/events.js";
import authenticate from "../middlewares/auth.js";
import Team from "../models/team.js";
import mongoose from "mongoose";

const router = express.Router();

const checkEvent = async (eventId) => Event.findById(eventId);
router.get("/:eventid/",async(req,res)=>{
const {eventid}=req.params;
const event = await checkEvent(eventid);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const teams=await Team.find({eventid}).populate("leader", "name username email")
      .populate("members", "name username email")
      .populate("requests.user", "name username email");
       
      return res.status(200).json(teams);
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
router.post("/team/join-request", authenticate, async (req, res) => {
  try {
    const { teamid } = req.body;
    const userid = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(teamid))
      return res.status(400).json({ message: "Invalid team ID" });

    const team = await Team.findById(teamid);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.requests.some((r) => r.user.toString() === userid))
      return res.status(400).json({ message: "Already requested" });

    if (team.members.includes(userid))
      return res.status(400).json({ message: "You are already a member" });

    team.requests.push({ user: userid });
    await team.save();

    const leader = await User.findById(team.leader);

    leader.notifications.push({
      message: `User ${req.user.name} requested to join team ${team.teamname}`,
      requser: userid,
      teamid: team._id, // IMPORTANT FIX
      createdAt: new Date(),
    });

    await leader.save();

    return res.json({ message: "Join request sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------------
   GET NOTIFICATIONS
--------------------------------------------------- */
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

/* ---------------------------------------------------
   APPROVE REQUEST
--------------------------------------------------- */
router.post("/team/approve-request", authenticate, async (req, res) => {
  try {
    const { notificationId } = req.body;
    const leaderId = req.user.id;

    const leader = await User.findById(leaderId);
    if (!leader) return res.status(404).json({ message: "Leader not found" });

    const note = leader.notifications.id(notificationId);
    if (!note) return res.status(404).json({ message: "Notification not found" });

    const { requser, teamid } = note;

    const team = await Team.findById(teamid);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.leader.toString() !== leaderId)
      return res.status(403).json({ message: "Not authorized" });

    team.members.push(requser);
    team.requests = team.requests.filter(
      (r) => r.user.toString() !== requser.toString()
    );
    await team.save();

    note.deleteOne();
    await leader.save();

    res.json({ message: "User added to team successfully" });
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
    const { notificationId } = req.body;
    const leaderId = req.user.id;

    const leader = await User.findById(leaderId);
    if (!leader) return res.status(404).json({ message: "Leader not found" });

    const note = leader.notifications.id(notificationId);
    if (!note) return res.status(404).json({ message: "Notification not found" });

    const { requser, teamid } = note;

    const team = await Team.findById(teamid);

    team.requests = team.requests.filter(
      (r) => r.user.toString() !== requser.toString()
    );
    await team.save();

    note.deleteOne();
    await leader.save();

    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
