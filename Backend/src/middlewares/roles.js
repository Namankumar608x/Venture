import Event from "../models/events.js";
import mongoose from "mongoose";

// Convert ObjectId safely
const normalize = (id) => id.toString();

export const checkadmin = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { eventid } = req.body;

        const event = await Event.findById(eventid);
        if (!event) return res.status(404).json({ message: "Event not found" });

        const isAdmin = event.admin.map(id => normalize(id)).includes(userId);

        if (!isAdmin)
            return res.status(403).json({ message: "Only event admin allowed" });

        req.event = event;
        next();

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};



export const checkmanager = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { eventid } = req.body;

        const event = await Event.findById(eventid);
        if (!event) return res.status(404).json({ message: "Event not found" });

        const isAdmin = event.admin.map(id => normalize(id)).includes(userId);
        const isManager = event.managers.map(id => normalize(id)).includes(userId);

        if (!isAdmin && !isManager)
            return res.status(403).json({ message: "Only managers/admin allowed" });

        req.event = event;
        next();

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};


/**
 * Check if user is staff (admin OR manager)
 * Used for posting updates, scheduling, etc.
 */
export const checkstaff = checkmanager;
