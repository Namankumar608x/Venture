// src/models/QueryMessage.js
import mongoose from "mongoose";

const QueryMessageSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  senderRole: { type: String, enum: ["participant", "event-admin", "club-admin"], required: true },
  message: { type: String, required: true },
  visibility: { type: String, enum: ["private", "public"], default: "private" }, // private -> only sender + organizers
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // used when organizer replies to a particular participant
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "QueryMessage", default: null },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const QueryMessage = mongoose.model("QueryMessage", QueryMessageSchema);
export default QueryMessage;
