// src/sockets/index.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import Event from "../models/events.js";
import Club from "../models/club.js";
import ChatMessage from "../models/ChatMessage.js";
import User from "../models/user.js";

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
    // DEBUGPING
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
        console.warn("⚠ join:event missing eventId");
        if (ack) ack({ success: false, error: "eventId required" });
        return;
      }
      try {
        socket.join(`event:${eventId}`);
        console.log(`📍 Socket joined room event:${eventId}`);
        if (ack) ack({ success: true });
      } catch (e) {
        console.error("🚨 join:event error:", e);
        if (ack) ack({ success: false, error: "join failed" });
      }
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
    // Socket disconnect event
    // -----------------------------------
    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", socket.id, "reason:", reason);
    });
  });
}
