// src/sockets/index.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import Event from "../models/events.js";
import Club from "../models/club.js";
import ChatMessage from "../models/ChatMessage.js";
import User from "../models/user.js";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET || "secret";

export default function setupSocket(io) {
  io.on("connection", async (socket) => {
    // --- Authenticate socket and attach socket.user (minimal info) ---
    try {
      let user = socket.data?.user || socket.user || null;

      if (!user) {
        const token =
          socket.handshake?.auth?.token ||
          (socket.handshake?.headers?.authorization || "").split(" ")[1];

        if (token) {
          try {
            const decoded = jwt.verify(token, JWT_SECRET);
            user = decoded;
            // attempt to fetch minimal user info from DB (non-fatal)
            try {
              const full = await User.findById(decoded.id || decoded._id).select("_id username name");
              if (full) user = { ...user, _id: full._id, username: full.username, name: full.name };
            } catch (e) {
              // ignore DB fetch errors, keep decoded payload as user
            }
          } catch (e) {
            console.warn("Socket token verify failed:", e.message);
            user = null;
          }
        }
      }

      socket.user = user || null;
    } catch (err) {
      console.warn("Socket auth parse error:", err);
      socket.user = null;
    }

    // --- Basic handlers ---
    socket.on("ping:test", (cb) => {
      if (typeof cb === "function") cb({ ok: true, time: new Date().toISOString() });
    });

    // Join/leave event room
    socket.on("join:event", async ({ eventId } = {}, ack) => {
      try {
        if (!eventId) {
          if (ack) ack({ success: false, error: "eventId required" });
          return;
        }
        socket.join(`event:${eventId}`);
        if (ack) ack({ success: true });
      } catch (err) {
        console.error("join:event error:", err);
        if (ack) ack({ success: false, error: "join failed" });
      }
    });

    socket.on("leave:event", async ({ eventId } = {}, ack) => {
      try {
        if (!eventId) {
          if (ack) ack({ success: false, error: "eventId required" });
          return;
        }
        socket.leave(`event:${eventId}`);
        if (ack) ack({ success: true });
      } catch (err) {
        console.error("leave:event error:", err);
        if (ack) ack({ success: false, error: "leave failed" });
      }
    });

    // Join/leave club room
    socket.on("join:club", ({ clubId } = {}, ack) => {
      try {
        if (!clubId) {
          if (ack) ack({ success: false, error: "clubId required" });
          return;
        }
        socket.join(`club:${clubId}`);
        if (ack) ack({ success: true });
      } catch (err) {
        console.error("join:club error:", err);
        if (ack) ack({ success: false, error: "join failed" });
      }
    });

    socket.on("leave:club", ({ clubId } = {}, ack) => {
      try {
        if (!clubId) {
          if (ack) ack({ success: false, error: "clubId required" });
          return;
        }
        socket.leave(`club:${clubId}`);
        if (ack) ack({ success: true });
      } catch (err) {
        console.error("leave:club error:", err);
        if (ack) ack({ success: false, error: "leave failed" });
      }
    });

    /**
     * chat:send (event announcement)
     * payload: { eventId, message }
     * only event-admin OR club-admin allowed to send announcements
     */
    socket.on("chat:send", async (payload = {}, ack) => {
      try {
        const { eventId, message } = payload || {};
        if (!eventId || !message || !message.trim()) {
          if (ack) ack({ success: false, error: "eventId and non-empty message required" });
          return;
        }

        if (!socket.user || !(socket.user.id || socket.user._id)) {
          if (ack) ack({ success: false, error: "Unauthorized (no user)" });
          return;
        }
        const userId = (socket.user.id || socket.user._id).toString();

        const event = await Event.findById(eventId);
        if (!event) {
          if (ack) ack({ success: false, error: "Event not found" });
          return;
        }

        // is event admin?
        const isEventAdmin = Array.isArray(event.admin)
          ? event.admin.some((id) => id.toString() === userId)
          : event.admin && event.admin.toString() === userId;

        // is club admin?
        let isClubAdmin = false;
        if (event.club) {
          const club = await Club.findById(event.club);
          if (club && club.admin) {
            isClubAdmin = Array.isArray(club.admin)
              ? club.admin.some((id) => id.toString() === userId)
              : club.admin.toString() === userId;
          }
        }

        if (!isEventAdmin && !isClubAdmin) {
          if (ack) ack({ success: false, error: "Only event or club admins can send announcements" });
          return;
        }

        const senderRole = isClubAdmin ? "club-admin" : "event-admin";

        const chat = new ChatMessage({
          text: message.trim(),
          eventId,
          sender: userId,
          senderRole,
        });

        const saved = await chat.save();
        const populated = await ChatMessage.findById(saved._id).populate("sender", "username name").lean();

        const payloadOut = {
          _id: populated._id,
          eventId: populated.eventId,
          text: populated.text,
          message: populated.text, // convenience alias for frontend
          sender: populated.sender,
          senderRole: populated.senderRole,
          createdAt: populated.createdAt || saved.createdAt,
        };

        // broadcast
        try {
          io.to(`event:${eventId}`).emit("chat:new", payloadOut);
          console.log("EMIT chat:new", { room: `event:${eventId}`, id: payloadOut._id });
        } catch (emitErr) {
          console.warn("Failed to emit chat:new", emitErr);
        }

        if (ack) ack({ success: true, data: payloadOut });
      } catch (err) {
        console.error("socket chat:send error:", err);
        if (ack) ack({ success: false, error: "Server error" });
      }
    });

    /**
     * chat:send:club (club announcement)
     * payload: { clubId, message }
     * only club-admin allowed to send
     */
    socket.on("chat:send:club", async (payload = {}, ack) => {
      try {
        const { clubId, message } = payload || {};
        if (!clubId || !message || !message.trim()) {
          if (ack) ack({ success: false, error: "clubId & non-empty message required" });
          return;
        }

        if (!socket.user || !(socket.user.id || socket.user._id)) {
          if (ack) ack({ success: false, error: "Unauthorized (no user)" });
          return;
        }
        const userId = (socket.user.id || socket.user._id).toString();

        const club = await Club.findById(clubId);
        if (!club) {
          if (ack) ack({ success: false, error: "Club not found" });
          return;
        }

        const isClubAdmin = Array.isArray(club.admin)
          ? club.admin.some((id) => id.toString() === userId)
          : club.admin && club.admin.toString() === userId;

        if (!isClubAdmin) {
          if (ack) ack({ success: false, error: "Only club admins can send" });
          return;
        }

        const chat = new ChatMessage({
          text: message.trim(),
          clubId,
          sender: userId,
          senderRole: "club-admin",
        });

        const saved = await chat.save();
        const populated = await ChatMessage.findById(saved._id).populate("sender", "username name").lean();

        const payloadOut = {
          _id: populated._id,
          clubId: populated.clubId,
          text: populated.text,
          message: populated.text,
          sender: populated.sender,
          senderRole: populated.senderRole,
          createdAt: populated.createdAt || saved.createdAt,
        };

        try {
          io.to(`club:${clubId}`).emit("chat:new:club", payloadOut);
          console.log("EMIT chat:new:club", { room: `club:${clubId}`, id: payloadOut._id });
        } catch (emitErr) {
          console.warn("Failed to emit chat:new:club", emitErr);
        }

        if (ack) ack({ success: true, data: payloadOut });
      } catch (err) {
        console.error("socket chat:send:club error:", err);
        if (ack) ack({ success: false, error: "Server error" });
      }
    });

    // disconnect
    socket.on("disconnect", (reason) => {
      // optional cleanup
      // console.log("Socket disconnected:", socket.id, reason);
    });
  });
}
