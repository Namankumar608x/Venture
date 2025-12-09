import mongoose from "mongoose";

const clubSchema = new mongoose.Schema({
    admin:{type: mongoose.Schema.Types.ObjectId,
        ref: "User",},
   managers:[{type: mongoose.Schema.Types.ObjectId,
            ref: "User",}],
   events:[{type: mongoose.Schema.Types.ObjectId,
        ref: "Event",}],
  createdAt: { type: Date, default: Date.now }
});

const clubModel = mongoose.model("Club", clubSchema);
export default clubModel;
