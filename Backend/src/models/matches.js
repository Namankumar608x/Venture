import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    eventid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    stageid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stage",
      required: true,
    },

    matchType: {
      type: String,
      enum: ["KNOCKOUT", "LEAGUE"],
      required: true,
    },

    status: {
      type: String,
      enum: ["upcoming", "live", "finished"],
      default: "upcoming",
    },

    teamA: {
      teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    },

    teamB: {
      teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    },

    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    isDraw: {
      type: Boolean,
      default: false,
    },

    decidedBy: {
      type: String,
      enum: ["NORMAL", "PENALTY"],
      default: "NORMAL",
    },

    scheduleid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
    },

    time: {
      type: Date,
    },

    // 🔥 LIVE SCORE ROUNDS
    rounds: [
      {
        roundNo: { type: Number, required: true },
        teamA_score: { type: Number, default: 0 },
        teamB_score: { type: Number, default: 0 },
        winner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
          default: null,
        },
        isCompleted: { type: Boolean, default: false },
      },
    ],

    currentRound: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const Match = mongoose.model("Match", matchSchema);
export default Match;
