import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    
  username: { type: String, required: true,unique: true },
  name: { type: String, required: true, },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  events:[{type: mongoose.Schema.Types.ObjectId,
      ref: "Event"}],
  clubs:[{type: mongoose.Schema.Types.ObjectId,
              ref: "Club",}],
  currentRefreshToken: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const userModel = mongoose.model("User", userSchema);
export default userModel;
