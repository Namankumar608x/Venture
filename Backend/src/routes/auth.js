import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import Club from "../models/club.js";
import Event from "../models/events.js";
import authenticate from "../middlewares/auth.js";
import { checkmanager } from "../middlewares/roles.js";

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

/* ----------------------------------------------------------
   SIGNUP
----------------------------------------------------------- */
router.post("/signup", async (req, res) => {
  try {
    const { username, name, email, password,roll_number,gender } = req.body;

    if (await User.findOne({ email }) || await User.findOne({ username }))
      return res.status(400).json({ message: "User already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, name, email, password: hashedPassword,roll_number,gender });

    const saved = await user.save();

    const accessToken = generateAccessToken(saved);
    const refreshToken = generateRefreshToken(saved);

    saved.currentRefreshToken = refreshToken;
    await saved.save();

    return res.json({
      message: "Signup successful",
      accessToken,
      refreshToken,
      user: {
        id: saved._id,
        username: saved.username,
        name: saved.name,
        email: saved.email,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error occurred!" });
  }
});

/* ----------------------------------------------------------
   NORMAL LOGIN
----------------------------------------------------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const exist = await User.findOne({ email });
    if (!exist)
      return res.status(400).json({ error: "User does not exist. Kindly signup first!" });

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

/* ----------------------------------------------------------
   LOGIN + JOIN CLUB
----------------------------------------------------------- */
router.post("/:clubid/login", async (req, res) => {
  try {
    const { clubid } = req.params;
    const { email, password } = req.body;

    const exist = await User.findOne({ email });
    if (!exist)
      return res.status(400).json({ error: "User does not exist" });

    const isMatch = await bcrypt.compare(password, exist.password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid credentials" });

    const club = await Club.findById(clubid);
    if (!club)
      return res.status(404).json({ message: "Club not found" });

    if (!exist.clubs.includes(clubid))
      exist.clubs.push(clubid);

    if (!club.users.some(id => id.toString() === exist._id.toString()))
      club.users.push(exist._id);

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

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error occurred!" });
  }
});

/* ----------------------------------------------------------
   SIGNUP + CLUB JOIN
----------------------------------------------------------- */
router.post("/:clubid/signup", async (req, res) => {
  try {
    const { clubid } = req.params;
    const { username, name, email, password,roll_number,gender } = req.body;

    if (await User.findOne({ email }) || await User.findOne({ username }))
      return res.status(400).json({ message: "User already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, name, email, password: hashedPassword,roll_number,gender });

    const saved = await user.save();

    const club = await Club.findById(clubid);
    if (!club)
      return res.status(404).json({ message: "Club not found" });

    saved.clubs.push(clubid);
    club.users.push(saved._id);

    
    await club.save();

    const accessToken = generateAccessToken(saved);
    const refreshToken = generateRefreshToken(saved);

    saved.currentRefreshToken = refreshToken;
    await saved.save();

    return res.json({
      message: "Signup successful",
      accessToken,
      refreshToken,
      user: {
        id: saved._id,
        username: saved.username,
        name: saved.name,
        email: saved.email,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error occurred!" });
  }
});

/* ----------------------------------------------------------
   USER SEARCH (FOR MANAGERS)
----------------------------------------------------------- */
router.post("/search-users", authenticate, async (req, res) => {
  try {
    const { q } = req.body;

    if (!q || q.trim() === "") return res.json([]);

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    }).limit(10);

    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------------------------------------
   REFRESH TOKEN
----------------------------------------------------------- */
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

    return res.json({
      accessToken: newAccessToken,
      refreshToken,
    });

  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

/* ----------------------------------------------------------
   /me - GET CURRENT USER
----------------------------------------------------------- */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -currentRefreshToken");

    if (!user)
      return res.status(404).json({ error: "User not found" });

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "Invalid access token" });
  }
});

export default router;
