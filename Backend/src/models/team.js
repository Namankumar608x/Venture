import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  teamname: { type: String, required: true },

  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  invitedEmails: [String],  // store emails of invited players

  eventid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  isRegistered: { type: Boolean, default: false } // once team registers for event

}, { timestamps: true });

export default mongoose.model("Team", teamSchema);
