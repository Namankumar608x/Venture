import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  admin:{type: mongoose.Schema.Types.ObjectId,
          ref: "User",},
  coordinator:[{type: mongoose.Schema.Types.ObjectId,
          ref: "User",}],
  managers:[{type: mongoose.Schema.Types.ObjectId,
        ref: "User",}],
  players:[{type: mongoose.Schema.Types.ObjectId,
        ref: "User",}],
  club:{type: mongoose.Schema.Types.ObjectId,
        ref: "Club",},
  createdAt: { type: Date, default: Date.now }
});

const eventModel = mongoose.model("Event", eventSchema);
export default eventModel;
