// src/sockets/index.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import Event from "../models/events.js";
import Club from "../models/club.js";
import ChatMessage from "../models/chatMessage.js";
import User from "../models/user.js";
import QueryMessage from "../models/QueryMessage.js"; // NEW: model for private queries

const JWT_SECRET = process.env.ACCESS_SECRET || process.env.JWT_SECRET || "ava";

console.log("⚙️ Socket setup - JWT_SECRET loaded:", JWT_SECRET ? true : false);

export default function setupSocket(io) {
  io.on("connection", async (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // -------------------
    // AUTHENTICATE SOCKET
    // -------------------
    try {
      let user = null;

      // try handshake auth token first
      const token =
        socket.handshake?.auth?.token ||
        (socket.handshake?.headers?.authorization || "").split(" ")[1] ||
        null;

      console.log("🧠 Socket auth - received token:", token ? "***TOKEN_PRESENT***" : null);

      if (!token) {
        console.warn("⚠️ No token provided to socket");
      } else {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          console.log("✔️ Token verified. Decoded payload:", decoded);
          user = decoded;

          // attempt to populate user info from DB
          try {
            const fullUser = await User.findById(decoded.id || decoded._id).select(
              "_id username name"
            );
            if (fullUser) {
              console.log("✔️ Loaded full user from DB:", fullUser.toObject());
              user = { ...user, ...fullUser.toObject() };
            }
          } catch (dbErr) {
            console.warn("⚠️ Failed to populate user from DB:", dbErr.message);
          }
        } catch (authErr) {
          console.warn("❌ Socket token verify failed:", authErr.message);
        }
      }

      socket.user = user;
      console.log("📦 Socket user attached:", socket.user);
    } catch (err) {
      console.error("🔴 Socket auth parse error:", err);
      socket.user = null;
    }

    // -------------------
    // Join personal & organizer rooms (if authenticated)
    // -------------------
    try {
      if (socket.user && (socket.user._id || socket.user.id)) {
        const uid = (socket.user._id || socket.user.id).toString();
        const personalRoom = `user:${uid}`;
        socket.join(personalRoom);
        console.log(`🔐 Joined personal room: ${personalRoom} for socket ${socket.id}`);

        // Try to find events this user is admin of, and join organizer rooms
        try {
          const adminEvents = await Event.find({ admin: uid }).select("_id").lean();
          if (Array.isArray(adminEvents) && adminEvents.length > 0) {
            adminEvents.forEach((ev) => {
              const orgRoom = `event-organizers:${ev._id.toString()}`;
              socket.join(orgRoom);
              console.log(`[sockets] user is admin -> joined ${orgRoom}`);
            });
          } else {
            console.log(`[sockets] no admin events found for user ${uid}`);
          }
        } catch (err) {
          console.warn("[sockets] error while fetching admin events to join organizer rooms:", err);
        }
      } else {
        console.log("[sockets] socket.user not present - skipping personal/organizer room joins");
      }
    } catch (err) {
      console.warn("[sockets] error in personal/organizer join logic:", err);
    }

    // -------------------
    // DEBUGPING
    // -------------------
    socket.on("ping:test", (cb) => {
      console.log("📡 Received ping:test from client");
      if (typeof cb === "function") cb({ ok: true, time: new Date().toISOString() });
    });

    // -------------------
    // JOIN/LEAVE event room
    // -------------------
    socket.on("join:event", ({ eventId } = {}, ack) => {
  console.log(`📥 join:event request for eventId=${eventId}`);

  if (!eventId) {
    if (ack) ack({ success: false, error: "eventId required" });
    return;
  }

  socket.join(`event:${eventId}`);

  // 🔥 DEBUG: confirm rooms
  console.log(
    "🧩 Socket rooms after join:event:",
    Array.from(socket.rooms)
  );

  if (ack) ack({ success: true });
});


    socket.on("leave:event", ({ eventId } = {}, ack) => {
      console.log(`📤 leave:event request for eventId=${eventId}`);
      if (!eventId) {
        if (ack) ack({ success: false, error: "eventId required" });
        return;
      }
      try {
        socket.leave(`event:${eventId}`);
        console.log(`📍 Socket left room event:${eventId}`);
        if (ack) ack({ success: true });
      } catch (e) {
        console.error("🚨 leave:event error:", e);
        if (ack) ack({ success: false, error: "leave failed" });
      }
    });

    // -------------------
    // JOIN/LEAVE club room
    // -------------------
    socket.on("join:club", ({ clubId } = {}, ack) => {
      console.log(`📥 join:club request for clubId=${clubId}`);
      if (!clubId) {
        if (ack) ack({ success: false, error: "clubId required" });
        return;
      }
      socket.join(`club:${clubId}`);
      console.log(`📍 Socket joined room club:${clubId}`);
      if (ack) ack({ success: true });
    });

    socket.on("leave:club", ({ clubId } = {}, ack) => {
      console.log(`📤 leave:club request for clubId=${clubId}`);
      if (!clubId) {
        if (ack) ack({ success: false, error: "clubId required" });
        return;
      }
      socket.leave(`club:${clubId}`);
      console.log(`📍 Socket left room club:${clubId}`);
      if (ack) ack({ success: true });
    });

    // -------------------------------
    // EVENT chat:send (event announcements)
    // (UNCHANGED behavior - only event or club admins can send)
    // -------------------------------
    socket.on("chat:send", async (payload = {}, ack) => {
      console.log("📩 Received chat:send event with payload:", payload);

      const { eventId, message } = payload || {};
      if (!eventId || !message?.trim()) {
        console.warn("⚠ chat:send invalid payload");
        if (ack) ack({ success: false, error: "eventId and non-empty message required" });
        return;
      }

      const userId = socket.user?.id || socket.user?._id;
      console.log("👤 chat:send userId:", userId);
      if (!userId) {
        if (ack) ack({ success: false, error: "Unauthorized (no user)" });
        return;
      }

      try {
        const event = await Event.findById(eventId);
        if (!event) {
          if (ack) ack({ success: false, error: "Event not found" });
          return;
        }

        const isEventAdmin = Array.isArray(event.admin)
          ? event.admin.some((id) => id.toString() === userId.toString())
          : event.admin?.toString() === userId.toString();

        let isClubAdmin = false;
        if (event.club) {
          const club = await Club.findById(event.club);
          isClubAdmin = club?.admin?.toString?.() === userId.toString();
        }

        console.log("⚖️ event/admin check:", { isEventAdmin, isClubAdmin });

        if (!isEventAdmin && !isClubAdmin) {
          if (ack) ack({ success: false, error: "Only event or club admins can send announcements" });
          return;
        }

        const chatDoc = new ChatMessage({
          text: message.trim(),
          eventId,
          sender: userId,
          senderRole: isClubAdmin ? "club-admin" : "event-admin",
        });

        const saved = await chatDoc.save();
        const populated = await ChatMessage.findById(saved._id).populate(
          "sender",
          "username name"
        );

        const payloadOut = {
          _id: populated._id,
          eventId: populated.eventId,
          text: populated.text,
          message: populated.text,
          sender: populated.sender,
          senderRole: populated.senderRole,
          createdAt: populated.createdAt,
        };

        console.log("📣 Emitting chat:new with payload:", payloadOut);
        io.to(`event:${eventId}`).emit("chat:new", payloadOut);

        if (ack) ack({ success: true, data: payloadOut });
      } catch (err) {
        console.error("❌ chat:send handler error:", err);
        if (ack) ack({ success: false, error: "Server error" });
      }
    });

    // -----------------------------------
    // CLUB chat:send:club (club announcement)
    // (UNCHANGED behavior)
    // -----------------------------------
    socket.on("chat:send:club", async (payload = {}, ack) => {
      console.log("📩 Received chat:send:club with payload:", payload);

      const { clubId, message } = payload || {};
      if (!clubId || !message?.trim()) {
        console.warn("⚠ chat:send:club invalid payload");
        if (ack) ack({ success: false, error: "clubId & non-empty message required" });
        return;
      }

      const userId = socket.user?.id || socket.user?._id;
      console.log("👤 club announcement userId:", userId);

      if (!userId) {
        if (ack) ack({ success: false, error: "Unauthorized (no user)" });
        return;
      }

      try {
        const club = await Club.findById(clubId);
        if (!club) {
          if (ack) ack({ success: false, error: "Club not found" });
          return;
        }

        const isClubAdmin = Array.isArray(club.admin)
          ? club.admin.some((id) => id.toString() === userId.toString())
          : club.admin?.toString() === userId.toString();

        console.log("⚖️ club admin check:", { isClubAdmin });

        if (!isClubAdmin) {
          if (ack) ack({ success: false, error: "Only club admins can send" });
          return;
        }

        const chatDoc = new ChatMessage({
          text: message.trim(),
          clubId,
          sender: userId,
          senderRole: "club-admin",
        });

        const saved = await chatDoc.save();
        const populated = await ChatMessage.findById(saved._id).populate(
          "sender",
          "username name"
        );

        const payloadOut = {
          _id: populated._id,
          clubId: populated.clubId,
          text: populated.text,
          message: populated.text,
          sender: populated.sender,
          senderRole: populated.senderRole,
          createdAt: populated.createdAt,
        };

        console.log("📣 Emitting chat:new:club with payload:", payloadOut);
        io.to(`club:${clubId}`).emit("chat:new:club", payloadOut);

        if (ack) ack({ success: true, data: payloadOut });
      } catch (err) {
        console.error("❌ chat:send:club handler error:", err);
        if (ack) ack({ success: false, error: "Server error" });
      }
    });

    // -----------------------------------
    // NEW: Private Event Query handler (participant <-> organizers)
    // -----------------------------------
    socket.on("query:send", async (payload = {}, ack) => {
      console.log("[query] Received query:send payload:", payload, "from socket:", socket.id);

      try {
        const { eventId, message, replyToId, targetUser, visibility } = payload || {};

        if (!eventId || !message || !message.trim()) {
          console.warn("[query] invalid payload");
          if (ack) ack({ success: false, error: "Invalid payload: eventId & message required" });
          return;
        }

        // require authenticated user
        if (!socket.user || !(socket.user._id || socket.user.id)) {
          console.warn("[query] unauthorized: no socket.user");
          if (ack) ack({ success: false, error: "Unauthorized" });
          return;
        }

        const userId = (socket.user._id || socket.user.id).toString();

        // load event
        const event = await Event.findById(eventId).lean();
        if (!event) {
          console.warn("[query] event not found:", eventId);
          if (ack) ack({ success: false, error: "Event not found" });
          return;
        }

        // determine roles: is admin? is participant?
        const isEventAdmin = Array.isArray(event.admin)
          ? event.admin.map(String).includes(userId)
          : event.admin?.toString() === userId;

        const isManager = Array.isArray(event.managers)
          ? event.managers.map(String).includes(userId)
          : false;

        // check participants array if present
        let isParticipant = false;
        if (Array.isArray(event.participants)) {
          isParticipant = event.participants.map(String).includes(userId);
        } else {
          // fallback: if no participants array, allow if user is present in socket.user (best-effort)
          isParticipant = true; // BE CAREFUL: change logic if you track participants elsewhere
        }

        console.log("[query] role checks:", { isEventAdmin, isManager, isParticipant });

        if (!isParticipant && !isEventAdmin && !isManager) {
          console.warn("[query] not authorized to send query for this event");
          if (ack) ack({ success: false, error: "Not authorized" });
          return;
        }

        // decide senderRole used in QueryMessage
        const senderRole = isEventAdmin || isManager ? "event-admin" : "participant";
        const finalVisibility = visibility === "public" && (isEventAdmin || isManager) ? "public" : "private";

        // targetUser resolution:
        // - if participant sends a query -> targetUser = sender (so admins know who asked)
        // - if admin sends a reply and included targetUser -> that participant gets it
        const finalTarget =
          senderRole === "participant" ? userId : (targetUser ? targetUser : null);

        // create and save QueryMessage
        const qdoc = await QueryMessage.create({
          eventId,
          sender: userId,
          senderRole,
          message: message.trim(),
          visibility: finalVisibility,
          targetUser: finalTarget,
          replyTo: replyToId || null,
        });

        const populated = await QueryMessage.findById(qdoc._id)
          .populate("sender", "username name")
          .lean();

        const out = {
          _id: populated._id,
          eventId: populated.eventId,
          message: populated.message,
          sender: populated.sender,
          senderRole: populated.senderRole,
          visibility: populated.visibility,
          targetUser: populated.targetUser,
          createdAt: populated.createdAt,
        };

        // Always notify organizers room for the event
        const organizersRoom = `event-organizers:${eventId}`;
        io.to(organizersRoom).emit("query:new", out);
        console.log(`[query] emitted query:new to organizers room ${organizersRoom}`);

        // Notify the individual user:
        if (senderRole === "participant") {
          // participant -> send to the participant themself (so they see their message)
          io.to(`user:${userId}`).emit("query:new", out);
          console.log(`[query] emitted query:new to sender user:${userId}`);
        } else {
          // sender is admin -> if a targetUser is provided, send to that participant only
          if (finalTarget) {
            io.to(`user:${finalTarget}`).emit("query:new", out);
            console.log(`[query] emitted query:new to target user:${finalTarget}`);
          } else {
            console.log("[query] admin message without targetUser -> only organizers notified");
          }
        }

        if (ack) ack({ success: true, data: out });
      } catch (err) {
        console.error("[query] query:send error:", err);
        if (ack) ack({ success: false, error: "Server error" });
      }
    });
    
    // -----------------------------------
    // Optional: allow admins to join organizer room on demand
    // -----------------------------------
    socket.on("join:organizer", async ({ eventId } = {}, ack) => {
      console.log(`[sockets] join:organizer request for eventId=${eventId} by socket ${socket.id}`);
      try {
        if (!socket.user || !(socket.user._id || socket.user.id)) {
          if (ack) ack({ success: false, error: "Unauthorized" });
          return;
        }
        if (!eventId) {
          if (ack) ack({ success: false, error: "eventId required" });
          return;
        }
        const event = await Event.findById(eventId).lean();
        if (!event) {
          if (ack) ack({ success: false, error: "Event not found" });
          return;
        }
        const userId = (socket.user._id || socket.user.id).toString();
        const isEventAdmin = Array.isArray(event.admin)
          ? event.admin.map(String).includes(userId)
          : event.admin?.toString() === userId;
        if (!isEventAdmin) {
          if (ack) ack({ success: false, error: "Not an organizer" });
          return;
        }
        const room = `event-organizers:${eventId}`;
        socket.join(room);
        console.log(`[sockets] socket ${socket.id} joined organizer room ${room}`);
        if (ack) ack({ success: true });
      } catch (err) {
        console.error("[sockets] join:organizer error:", err);
        if (ack) ack({ success: false, error: "Server error" });
      }
    });
    

    // -----------------------------------
    // Socket disconnect event
    // -----------------------------------
    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", socket.id, "reason:", reason);
    });
  });
}
