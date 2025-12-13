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

const router=express.Router();
router.get("/:scheduleid", async (req, res) => {
  try {
    const { scheduleid } = req.params;

    const schedule = await Schedule.findById(scheduleid)
      .populate("qualifiedteams", "teamname members")
      .populate({
        path: "matches",
        populate: [
          { path: "teamA.teamId", model: "Team", select: "teamname members" },
          { path: "teamB.teamId", model: "Team", select: "teamname members" }
        ]
      });

    if (!schedule)
      return res.status(404).json({ message: "Schedule not found" });

    return res.status(200).json({
      schedule,
      matches: schedule.matches || [],
      qualified: schedule.qualifiedteams || [],
      role: req.user?.role || "participant",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/:eventid/new-schedule",authenticate,async(req,res)=>{
    try {
      const {eventid}=req.params;
const {title,date,time,location,description}=req.body;
if( !title || !date || !time || !location ) return res.status(400).json({ message: "Missing fields" });
const event=await Event.findById(eventid);
 if (!event) return res.status(404).json({ message: "Event not found" });
const schedule = new Schedule({
  title,
  date,
  time,
  location,
  description,
  eventid
});
await schedule.save();
return res.status(200).json({
    message:`New schedule for ${event.name} created `
});
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
    }


});
export default router;