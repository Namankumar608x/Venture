import express from "express";
import authenticate from "../middlewares/auth.js";
import User from "../models/user.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate("notifications");

    res.status(200).json({
      notifications: user.notifications || []
    });

  } catch (err) {
    console.error("GET /notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
