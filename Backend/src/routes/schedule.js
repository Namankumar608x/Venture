import express from "express";
import User from "../models/user.js";
import Club from "../models/club.js";
import Event from "../models/events.js";
import authenticate from "../middlewares/auth.js";
import Match from "../models/matches.js";
import mongoose from "mongoose";
import Team from "../models/team.js";
import {checkadmin,checkmanager} from "../middlewares/roles.js";
const router=express.Router();
router.get("/:clubid/:eventId/:scheduleId", authenticate, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user.id;

    // STEP 1: Locate the event that contains the schedule
    const event = await Event.findOne({ "schedule._id": scheduleId })
      .populate("teams");

    if (!event) {
      return res.status(404).json({ message: "Schedule not found in event" });
    }

    // STEP 2: Fetch this specific schedule
    const schedule = event.schedule.id(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule does not exist" });
    }

    // STEP 3: Fetch matches belonging to this schedule
    const matches = await Match.find({ scheduleid: scheduleId })
      .populate("teamA", "teamname members")
      .populate("teamB", "teamname members");

    // STEP 4: Qualified teams (OPTIONAL)
    // If you store qualified in event like event.qualifiedTeams[scheduleId]
    const qualifiedTeams = event.qualifiedTeams?.[scheduleId] || [];

    // STEP 5: Identify the user's role in this event
    let role = "participant";
    if (event.admin.map(id => id.toString()).includes(userId)) {
      role = "admin";
    } else if (event.managers.map(id => id.toString()).includes(userId)) {
      role = "manager";
    }

    // RESPONSE
    return res.json({
      eventId: event._id,
      schedule,
      matches,
      qualified: qualifiedTeams,
      role,
    });

  } catch (err) {
    console.error("Schedule Route Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;