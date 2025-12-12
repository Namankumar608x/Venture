import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: false, index: true },
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: false, index: true }, // NEW
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderRole: { type: String, enum: ["event-admin", "club-admin", "manager"], default: "event-admin" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
export default ChatMessage;
