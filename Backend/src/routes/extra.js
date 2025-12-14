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
const normalize = (id) => id.toString();
router.post("/:eventId/edit-event",authenticate,async(req,res)=>{
try {
    const {eventId}=req.params;
    const userid=req.user.id;
    const {name,description,maxPlayer,status,rules}=req.body;
    const event=await Event.findById(eventId);
     if (!event) return res.status(404).json({ message: "Event not found" });
     const isAdmin = event.admin.map(id => normalize(id)).includes(userid);
        const isManager = event.managers.map(id => normalize(id)).includes(userid);

        if (!isAdmin && !isManager)
            return res.status(403).json({ message: "Only managers/admin allowed" });
    if (rules && !Array.isArray(rules)) {
        return res
          .status(400)
          .json({ message: "Rules must be an array" });
      }

      if (rules) {
        for (const rule of rules) {
          if (rule.title && !rule.points?.length) {
            return res.status(400).json({
              message:
                "Each rule must have at least one point",
            });
          }
        }
      }
       event.name = name ?? event.name;
       event.description=description??event.description;
      event.maxPlayer = maxPlayer ?? event.maxPlayer;
      event.status = status ?? event.status;
       if (rules) {
        event.rules = rules;
      }

      await event.save();

      return res.status(200).json({
        message: "Event updated successfully",
        event,
      });
   
} catch (err) {
    console.error(err);
      return res
        .status(500)
        .json({ message: "Server error" });
    }

});

export default router;