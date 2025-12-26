import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import Club from "../models/club.js";
import authenticate from "../middlewares/auth.js";
import OTP from "../models/otp.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendMail } from "../utils/sendMail.js";

const router = express.Router();

const ACCESS_SECRET = process.env.ACCESS_SECRET || "ava";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "ava";

function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, name: user.name, email: user.email },
    ACCESS_SECRET,
    { expiresIn: "7d" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: "7d" });
}

/* ============================================================
   SIGNUP  → SEND OTP
============================================================ */
router.post("/signup", async (req, res) => {
  try {
    const { username, name, email, password, roll_number, gender } = req.body;

    if (await User.findOne({ email }) || await User.findOne({ username }))
      return res.status(400).json({ message: "User already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      name,
      email,
      password: hashedPassword,
      roll_number,
      gender,
      isVerified: false,
    });

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await sendMail(email, otp);

    return res.json({
      message: "Signup successful. OTP sent to your email.",
      email,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error occurred!" });
  }
});



/* ============================================================
   VERIFY SIGNUP OTP
============================================================ */
router.post("/verify-signup-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email });
    if (!record)
      return res.status(400).json({ message: "OTP not found" });

    if (record.expiresAt < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    const valid = await bcrypt.compare(otp, record.otp);
    if (!valid)
      return res.status(400).json({ message: "Invalid OTP" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    user.isVerified = true;
    await user.save();

    await OTP.deleteMany({ email });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.currentRefreshToken = refreshToken;
    await user.save();

    return res.json({
      message: "Email verified successfully",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "OTP verification failed" });
  }
});



/* ============================================================
   NORMAL LOGIN (BLOCK IF NOT VERIFIED)
============================================================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const exist = await User.findOne({ email });
    if (!exist)
      return res.status(400).json({ error: "User does not exist" });

    if (!exist.isVerified)
      return res.status(403).json({ error: "Please verify your email first" });

    const isMatch = await bcrypt.compare(password, exist.password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = generateAccessToken(exist);
    const refreshToken = generateRefreshToken(exist);

    exist.currentRefreshToken = refreshToken;
    await exist.save();

    return res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: exist._id,
        username: exist.username,
        name: exist.name,
        email: exist.email,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error occurred!" });
  }
});



/* ============================================================
   EVERYTHING ELSE (UNCHANGED)
============================================================ */

// login + join club
router.post("/:clubid/login", async (req, res) => {
  try {
    const { clubid } = req.params;
    const { email, password } = req.body;

    const exist = await User.findOne({ email });
    if (!exist) return res.status(400).json({ error: "User does not exist" });

    if (!exist.isVerified)
      return res.status(403).json({ message: "Please verify your email first" });

    const isMatch = await bcrypt.compare(password, exist.password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid credentials" });

    const club = await Club.findById(clubid);
    if (!club) return res.status(404).json({ message: "Club not found" });

    if (!exist.clubs.includes(clubid)) exist.clubs.push(clubid);
    if (!club.users.includes(exist._id)) club.users.push(exist._id);

    await club.save();
    await exist.save();

    const accessToken = generateAccessToken(exist);
    const refreshToken = generateRefreshToken(exist);

    exist.currentRefreshToken = refreshToken;
    await exist.save();

    return res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: exist._id,
        username: exist.username,
        name: exist.name,
        email: exist.email,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error occurred!" });
  }
});



/* ============================================================
   REFRESH TOKEN
============================================================ */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken)
      return res.status(401).json({ error: "No refresh token provided" });

    const payload = jwt.verify(refreshToken, REFRESH_SECRET);

    const user = await User.findById(payload.id);
    if (!user)
      return res.status(401).json({ error: "User not found" });

    if (user.currentRefreshToken !== refreshToken)
      return res.status(401).json({ error: "Invalid refresh token" });

    const newAccessToken = generateAccessToken(user);

    return res.json({ accessToken: newAccessToken, refreshToken });

  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

/* ============================================================
   CURRENT USER
============================================================ */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -currentRefreshToken");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: "Invalid access token" });
  }
});
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await sendMail(email, otp);

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});
router.post("/verify-forgot-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email });
    if (!record)
      return res.status(400).json({ message: "OTP not found" });

    if (record.expiresAt < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    const valid = await bcrypt.compare(otp, record.otp);
    if (!valid)
      return res.status(400).json({ message: "Invalid OTP" });

    await OTP.deleteMany({ email });

    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed" });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!newPassword)
      return res.status(400).json({ message: "Password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Reset failed" });
  }
});

export default router;
