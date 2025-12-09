import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import Club from "../models/club.js";
const router=express.Router();

const ACCESS_SECRET = process.env.ACCESS_SECRET || "ava";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "ava";

function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id,username:user.username, name: user.name, email: user.email },
    ACCESS_SECRET,
    { expiresIn: "59m" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: "7d" });
}

router.post("/signup/:id?",async(req,res)=>{
    const id=req.params.id;
const {username,name,email,password}=req.body;
try {
    const check1=await User.findOne({email});
    const check2=await User.findOne({username});
    if(check1 || check2) return res.status(400).json({ MessageEvent: "User already exists!" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user=new User({username,name,email,password:hashedPassword});
    if(id){
        const check=await Club.findById({id});
        if(check){
           user.clubs.push(id);
        }
        else{
            return res.status(500).json({message:"Club Invite Id doesnt exist or broken! Signup not sucessfull!"});
        }
   
    }
    const saved=await user.save();
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
        username:saved.username,
        name: saved.name,
        email: saved.email,
      },
    });
} catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error occurred!" });
}


});
router.post("/login/:id?", async (req, res) => {
    const id=req.params.id;
  const { email, password } = req.body;
  try {
    
    const exist = await User.findOne({ email });
    if (!exist)
      return res
        .status(400)
        .json({ error: "User does not exist. Kindly signup first!" });

    const isMatch = await bcrypt.compare(password, exist.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    if(id){
        const check=await Club.findById({id});
        if(!check){
          return res.status(500).json({message:"Club Invite Id doesnt exist or broken! Signup not sucessfull!"}); 
        }
        
    }
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
        username:exist.username,
        name: exist.name,
        email: exist.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error occurred!" });
  }
});
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ error: "No refresh token provided" });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const existingUser = await Userm.findById(payload.id);
    if (!existingUser)
      return res.status(401).json({ error: "User not found" });

    if (existingUser.currentRefreshToken !== refreshToken)
      return res.status(401).json({ error: "Invalid refresh token" });

    const newAccessToken = generateAccessToken(existingUser);
    return res.json({ accessToken: newAccessToken, refreshToken });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "No auth header" });
    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, ACCESS_SECRET);
    const user = await Userm.findById(payload.id).select(
      "-password -currentRefreshToken"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "Invalid access token" });
  }
});
export default router;
