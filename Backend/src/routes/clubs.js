// routes/club.js
import express from "express";
import Club from "../models/club.js";
import User from "../models/user.js";
import auth from "../middlewares/auth.js";
import ChatMessage from "../models/ChatMessage.js";
import Team from "../models/team.js";
import Schedule from "../models/schedule.js";
import Match from "../models/matches.js";
import Event from "../models/events.js";
const router=express.Router();

//crreating club or current user as admin
router.post("/new",auth,async(req,res)=>{
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

    return res.status(200).json({
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
// GET /club/:clubId/chat  -> fetch club announcements/messages (paginated)
router.get("/:clubId/chat", auth, async (req, res) => {
  try {
    const { clubId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await ChatMessage.find({ clubId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username name")
      .lean();

    return res.json({ success: true, data: messages.reverse(), page, limit });
  } catch (err) {
    console.error("GET /club/:clubId/chat error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

// POST /club/:clubId/chat  -> create announcement (only club admins)
router.post("/:clubId/chat", auth, async (req, res) => {
  try {
    const { clubId } = req.params;
    const { message } = req.body;
    const userId = req.user && (req.user.id || req.user._id);

    if (!message || !message.trim()) return res.status(400).json({ success: false, error: "Message required" });

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ success: false, error: "Club not found" });

    // check club admin membership (club.admin may be id or array)
    const isClubAdmin = Array.isArray(club.admin) ? club.admin.some(id => id.toString() === userId) : club.admin && club.admin.toString() === userId;
    if (!isClubAdmin) return res.status(403).json({ success: false, error: "Only club admins can post announcements" });

    const chat = new ChatMessage({
      text: message.trim(),
      clubId,
      sender: userId,
      senderRole: "club-admin"
    });
    const saved = await chat.save();
    const populated = await ChatMessage.findById(saved._id).populate("sender", "username name").lean();

    // Emit via socket if available
    const io = req.app?.locals?.io;
    const payload = {
      _id: populated._id,
      clubId: populated.clubId,
      text: populated.text,
      message: populated.text,
      sender: populated.sender,
      senderRole: populated.senderRole,
      createdAt: populated.createdAt
    };
    if (io) io.to(`club:${clubId}`).emit("chat:new:club", payload);

    return res.json({ success: true, data: payload });
  } catch (err) {
    console.error("POST /club/:clubId/chat error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});
// GET /clubs/:clubId  -> return club info (for frontend admin detection)
router.get("/:clubId", auth, async (req, res) => {
  try {
    const { clubId } = req.params;
    const club = await Club.findById(clubId).lean();
    if (!club) return res.status(404).json({ success:false, error: "Club not found" });
    return res.json({ success: true, club });
  } catch (err) {
    console.error("GET /clubs/:clubId error:", err);
    return res.status(500).json({ success:false, error: "Server error" });
  }
});
router.post("/leave",auth,async(req,res)=>{
try {
  const {clubid}=req.body;
  const userid=req.user.id;
  
   const club = await Club.findById(clubid).populate("events");
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // ❌ Admin cannot leave directly
    if (club.admin.toString() === userid) {
      return res.status(403).json({
        message:
          "Admin cannot leave the club. Transfer admin role or delete the club.",
      });
    }

    // 1️⃣ Remove from club members & managers
    await Club.findByIdAndUpdate(clubid, {
      $pull: {
        members: userid,
        managers: userid,
      },
    });

    // 2️⃣ Remove club from user
    await User.findByIdAndUpdate(userid, {
      $pull: { clubs: clubid },
    });

    // 3️⃣ Remove user from all events of this club
    const eventIds = club.events.map((e) => e._id);

    await Event.updateMany(
      { _id: { $in: eventIds } },
      {
        $pull: {
          players: userid,
          managers: userid,
          admin: userid,
        },
      }
    );

    // 4️⃣ Remove user from teams of those events
    await Team.updateMany(
      { event: { $in: eventIds } },
      { $pull: { members: userid } }
    );

    // 5️⃣ If user was leader → optional auto-delete or transfer
    await Team.deleteMany({
      event: { $in: eventIds },
      leader: userid,
    });

    return res.status(200).json({
      message: "Successfully left the club",
    });


} catch (error) {
  
}
});
router.delete("/delete",auth,async(req,res)=>{
try {
  const {eventid}=req.body;
    const userid = req.user.id;

    if (!eventid) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    // 1️⃣ Find event
    const event = await Event.findById(eventid);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 2️⃣ Authorization: only admin or manager
    const isAdmin =
      event.admin.some(id => id.toString() === userid) ||
      event.managers?.some(id => id.toString() === userid);

    if (!isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }

    // 3️⃣ Remove event from club
    await Club.findByIdAndUpdate(event.club, {
      $pull: { events: eventid }
    });

    // 4️⃣ Remove event from all users
    await User.updateMany(
      { events: eventid },
      { $pull: { events: eventid } }
    );

    // 5️⃣ Delete related teams
    await Team.deleteMany({ event: eventid });

    // 6️⃣ Delete related schedules
    await Schedule.deleteMany({ event: eventid });

    // 7️⃣ Delete related matches (if you have this model)
    await Match.deleteMany({ event: eventid });

    // 8️⃣ Finally delete the event
    await Event.findByIdAndDelete(eventid);

    return res.status(200).json({
      message: "Event deleted successfully",
    });

  } catch (error) {
    console.error("Delete event error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
