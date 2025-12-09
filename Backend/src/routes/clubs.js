// routes/club.js
import express from "express";
import Club from "../models/club.js";
import User from "../models/user.js";
import auth from "../middlewares/auth.js";

const router=express.Router();

//crreating club or current user as admin
router.post("/",auth,async(req,res)=>{
  try{
    // baki detailed info baadme add karenge
     const {name}=req.body;
    if(!name) return res.status(400).json({error:"name is required"});

    const club=new Club({
      name,
      admin:req.user.id,
      managers:[],
      events:[],
    });

    const saved=await club.save();

    await User.findByIdAndUpdate(
      req.user.id,
      {$addToSet:{clubs:saved._id}}
    );

    return res.status(201).json({
      message:"Tournament created successfully",
      tournament:saved,
    });
  }catch(err){
    console.error(err);
    return res.status(500).json({error:"Server error while creating tournament"});
  }
});
router.post("/join",auth,async(req,res)=>{
  try{
    const {clubId}=req.body;
    if(!clubId) return res.status(400).json({error:"clubId is required"});

    const club=await Club.findById(clubId);
    if(!club) return res.status(404).json({error:"Tournament not found"});

    // add club to user's club list
    await User.findByIdAndUpdate(
      req.user.id,
      {$addToSet:{clubs:clubId}}
    );

    return res.json({
      message:"Joined tournament successfully",
      tournament:club,
    });
  }catch(err){
    console.error(err);
    return res.status(500).json({error:"Server error while joining tournament"});
  }
});
router.get("/my-admin",auth,async(req,res)=>{
  try{
    const clubs=await Club.find({admin:req.user.id}).sort({createdAt:-1});
    return res.json({tournaments:clubs});
  }catch(err){
    console.error(err);
    return res.status(500).json({error:"Server error while fetching tournaments"});
  }
});
router.get("/participant",auth,async(req,res)=>{
  try{
    const user=await User.findById(req.user.id).populate("clubs");
    return res.json({tournaments:user.clubs});
  }catch(err){
    console.error(err);
    return res.status(500).json({error:"Server error while fetching my tournaments"});
  }
});

export default router;
