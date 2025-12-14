import express from "express";
import User from "../models/user.js";
import Club from "../models/club.js";
import Event from "../models/events.js";
import authenticate from "../middlewares/auth.js";
import Match from "../models/matches.js";
import mongoose from "mongoose";
import Team from "../models/team.js";
import Schedule from "../models/schedule.js";
import {checkadmin,checkmanager} from "../middlewares/roles.js";
import QueryMessage from "../models/QueryMessage.js";
import Stage from "../models/stages.js";


// Utility: shuffle array (Fisher-Yates)
const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Utility: nearest lower power of 2
const nearestPowerOfTwo = (n) => {
  let p = 1;
  while (p * 2 <= n) p *= 2;
  return p;
};

async function progressKnockoutWinner(match) {
  console.log("[PROGRESSION] Starting progression");

  const currentStage = await Stage.findById(match.stageid);
  if (!currentStage) return;

  console.log("[PROGRESSION] Current Stage:", currentStage.name);

  // Find next stage safely
  const nextStage = await Stage.findOne({
    eventid: currentStage.eventid,
    order: { $gt: currentStage.order }
  }).sort({ order: 1 });

  if (!nextStage) {
    console.log("[PROGRESSION] No next stage (tournament end)");
    return;
  }

  console.log("[PROGRESSION] Next Stage:", nextStage.name);

  // Find index of match in current stage
  const matchIndex = currentStage.matches.findIndex(
    id => id.toString() === match._id.toString()
  );

  if (matchIndex === -1) {
    console.log("[PROGRESSION][ERROR] Match not found in stage");
    return;
  }

  const nextMatchIndex = Math.floor(matchIndex / 2);
  const slot = matchIndex % 2 === 0 ? "teamA" : "teamB";

  const nextMatchId = nextStage.matches[nextMatchIndex];
  const nextMatch = await Match.findById(nextMatchId);

  if (!nextMatch) return;

  console.log(
    `[PROGRESSION] Placing winner in ${nextStage.name} → Match ${nextMatchIndex} → ${slot}`
  );

  nextMatch[slot].teamId = match.winner;
  await nextMatch.save();

  console.log("[PROGRESSION] Winner progressed successfully");
}

const router=express.Router();
const checkEvent = async (eventId) => {
  return await Event.findById(eventId);
};

router.post("/new",authenticate,async(req,res)=>{
const userid=req.user.id;
const {clubid,name,description,maxPlayer,status,teamc}=req.body;
try {
    const check=await Club.findById(clubid);//club exist karta hai ya nahi
if(!check){
    return res.status(404).json({message:"No club found!"});
}
if (check.admin.toString()===userid || check.managers.map(id=>id.toString()).includes(userid)){
    const event=new Event({name,admin:[userid],club:clubid,description,maxPlayer,status,teamsBy:teamc});
    const newevent=await event.save();
    check.events.push(newevent._id);
    const user=await User.findById(userid);
    user.events.push(newevent._id);
    await user.save();
    await check.save();
    return res.status(200).json({message:"event created",eventId: newevent._id});
}
else{
    return res.status(401).json({message:"Unauthorized"});
}
} catch (error) {
     console.error(error);
    return res.status(500).json({ error: "Server error occurred!" });
}

});
// router.post("/promote", authenticate, checkadmin, async (req, res) => {
//   try {
//     console.log("/promote route hit");
//     const { userid, post, eventid } = req.body;

//     if (!userid || !post)
//       return res.status(400).json({ message: "Missing data" });

//     let user;

//     // If userid is a valid ObjectId → search by _id
//     if (mongoose.Types.ObjectId.isValid(userid)) {
//       user = await User.findById(userid);
//     } 
//     else {
//       // Otherwise, treat it as username OR email
//       user = await User.findOne({
//         $or: [{ email: userid }, { username: userid }]
//       });
//     }

//     if (!user)
//       return res.status(404).json({ message: "User does not exist" });

//     // Update role
//     user.role = post;
//     await user.save();

//     return res.json({ message: "User promoted successfully", user });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });
router.post("/promote",authenticate,checkmanager,async(req,res)=>{
const adminid=req.user.id;
const {userid,eventid,post}=req.body;
try {
    const check=await User.findById(userid);
  if(!check) return res.status(404).json({message:"No user found!"})

const event=await Event.findById(eventid);

  if (!event) return res.status(404).json({ message: "Event not found" });
  const clubid=event.club;
  const club=await Club.findById(clubid);
 if (!check.clubs.map(id => id.toString()).includes(clubid.toString())){
  check.clubs.push(clubid);
  await check.save();

 }
   
  
  if (!event.admin.map(id => id.toString()).includes(adminid))
      return res.status(401).json({ message: "Unauthorized" });
if(post==="admin"){
    if(event.admin.length>=2) return res.status(400).json({message:"Can't make more than 2 admins"});
    if (!event.admin.map(id => id.toString()).includes(userid)) {
    event.admin.push(userid);
    check.events.push(eventid);
    await event.save();
    await check.save();
    return res.status(200).json({message:"new admin created"});
}

     
}
else{
   if (!event.managers.map(id => id.toString()).includes(userid)) {
    event.managers.push(userid);
    check.events.push(eventid);
    await check.save();
    await event.save();
   return res.status(200).json({message:"new manager created"});
}
else{
      return res.status(401).json({ message: "User is already a manager" });
}
     
    
}
} catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error occurred!" });
}

});

router.post("/updates",authenticate,checkmanager,async(req,res)=>{
try {
    const userid=req.user.id;
    const {eventid,message}=req.body;
    const event=await Event.findById(eventid);
    if (!event) return res.status(404).json({ message: "Event not found" });
    event.updates.push({
        message,
        createdBy:userid,
        })
        await event.save();
        return res.status(200).json({message:"Message emitted sucessfully"});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/new-schedule",authenticate,async(req,res)=>{
    try {
const {eventid,title,date,time,location,description}=req.body;
if(!eventid || !title || !date || !time || !location ) return res.status(400).json({ message: "Missing fields" });
const event=await Event.findById(eventid);
 if (!event) return res.status(404).json({ message: "Event not found" });
event.schedule.push({
   _id: new mongoose.Types.ObjectId(), title,date,time,location,description
});
await event.save();
return res.status(200).json({
    message:`New schedule for ${event.name} created `
});
    } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
    }


});

router.post("/join-event",authenticate,async(req,res)=>{
  try {
    const playerid=req.user.id;
    const {scheduleid,eventid}=req.body;
    const user=await User.findById(playerid);
const event=await Event.findById(eventid);
 if (!event)
      return res.status(404).json({ message: "Event not found" });

  if (event.players.map(id => id.toString()).includes(playerid)) return res.status(400).json({message:"player already in event"});
event.players.push(playerid);
await event.save();
user.events.push(eventid);
await user.save();
return res.status(200).json({message:"player added"});

  } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

});


router.post("/match/create",authenticate,checkmanager, async (req, res) => {
  const { eventid, teamA, teamB, scheduleid,time} = req.body;
  const event = await Event.findById(eventid);
if (!event) return res.status(404).json({ message: "Event not found" });

const teamIds = event.teams.map(id => id.toString());
if (!teamIds.includes(teamA.toString()) || !teamIds.includes(teamB.toString()))
  return res.status(400).json({ message: "Teams not part of event" });


const schedule = event.schedule.id(scheduleid);
if (!schedule) return res.status(400).json({ message: "Schedule not part of event" });
  const match = await Match.create({
    eventid,
    scheduleid,
    teamA: { teamId: teamA },
    teamB: { teamId: teamB },
    time
  });


  res.json({ message: "Match created", match });
});



//get routes-
router.get("/club/:clubId", authenticate, async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId).populate("events");

    if (!club) return res.status(404).json({ message: "Club not found" });

    return res.status(200).json({
      club: club.name,
      events: club.events
    });
  } catch (error) {
    console.error("GET /events/club/:clubId", error);
    return res.status(500).json({ message: "Server error" });
  }
});
// GET: events user created or joined
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await Event.find({
      $or: [
        { admin: userId },
        { managers: userId },
        { players: userId }
      ]
    });

    return res.status(200).json({ events });
  } catch (error) {
    console.error("GET /events", error);
    return res.status(500).json({ message: "Server error" });
  }
});
router.get("/:eventId/teams", authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("teams");

    if (!event) return res.status(404).json({ message: "Event not found" });

    return res.status(200).json({ teams: event.teams });
  } catch (error) {
    console.error("GET /events/:eventId/teams", error);
    return res.status(500).json({ message: "Server error" });
  }
});
router.get("/:eventId/schedules", authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) return res.status(404).json({ message: "Event not found" });

    const schedules=await Schedule.find({eventid:eventId});
    return res.status(200).json(schedules);
  } catch (error) {
    console.error("GET /events/:eventId/schedules", error);
    return res.status(500).json({ message: "Server error" });
  }
});
 router.get("/club/:clubId", authenticate, async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId).populate("events");

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    return res.status(200).json({
      club: club.name,
      events: club.events
    });
  } catch (error) {
    console.error("GET /events/club/:clubId error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});



router.get("/roles/:eventid", authenticate, async (req, res) => {
  try {
    const eventid = req.params.eventid;

    const event = await Event.findById(eventid).populate("admin managers", "username email name");
    if (!event) return res.status(404).json({ message: "Event not found" });

    return res.json({
      admins: event.admin || [],
      managers: event.managers || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/:eventId", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const event = await Event.findById(req.params.eventId)
      .populate("teams")

    if (!event) return res.status(404).json({ message: "Event not found" });

    // Check roles
    let isAdmin = event.admin?.map(id => id.toString()).includes(userId);

let isManager = event.managers?.map(id => id.toString()).includes(userId);


    res.json({
      event,
      role: isAdmin ? "admin" : isManager ? "manager" : "participant",
      
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// -------------------
// PRIVATE QUERY ROUTES (GET + POST)
// -------------------



// GET: fetch queries for an event
router.get("/:eventId/queries", authenticate, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user?.id || req.user?._id;

    console.log("[routes:event] GET /:eventId/queries user:", userId);

    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    const uid = String(userId);

    const isEventAdmin = Array.isArray(event.admin)
      ? event.admin.map(String).includes(uid)
      : event.admin?.toString() === uid;

    const isManager = Array.isArray(event.managers)
      ? event.managers.map(String).includes(uid)
      : false;

    let query = { eventId };

    if (!(isEventAdmin || isManager)) {
      // participant view → private only
      query = {
        eventId,
        $or: [{ sender: uid }, { targetUser: uid }],
        visibility: "private",
      };
    }

    const items = await QueryMessage.find(query)
      .sort({ createdAt: 1 })
      .populate("sender", "username name")
      .lean();

    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("[routes:event] GET queries error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

// POST: create query (fallback when socket unavailable)
router.post("/:eventId/queries", authenticate, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const message = (req.body?.message || "").trim();
    const userId = req.user?.id || req.user?._id;

    console.log("[routes:event] POST /:eventId/queries body:", req.body);

    if (!message) return res.status(400).json({ success: false, error: "Message required" });

    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    const uid = String(userId);

    const isEventAdmin = Array.isArray(event.admin)
      ? event.admin.map(String).includes(uid)
      : event.admin?.toString() === uid;

    const isManager = Array.isArray(event.managers)
      ? event.managers.map(String).includes(uid)
      : false;

    let isParticipant = true;
    if (Array.isArray(event.participants)) {
      isParticipant = event.participants.map(String).includes(uid);
    }

    if (!isParticipant && !isEventAdmin && !isManager) {
      console.warn("[routes:event] unauthorized POST query", uid);
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const senderRole = isEventAdmin || isManager ? "event-admin" : "participant";
    const visibility = "private";
    const targetUser = senderRole === "participant" ? uid : req.body.targetUser || null;

    const q = await QueryMessage.create({
      eventId,
      sender: uid,
      senderRole,
      message,
      visibility,
      targetUser,
      replyTo: req.body.replyToId || null,
    });

    const populated = await QueryMessage.findById(q._id)
      .populate("sender", "username name")
      .lean();

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error("[routes:event] POST queries error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});


// ---------------------------------------------------
// STEP 1: GENERATE SCHEDULE (SKELETON)
// ---------------------------------------------------
router.post("/:eventId/schedule", authenticate, async (req, res) => {
  const userId = req.user.id;
  const { eventId } = req.params;
  const { type } = req.body;

  console.log("=====================================");
  console.log("[SCHEDULE] Schedule generation request");
  console.log("[SCHEDULE] User:", userId);
  console.log("[SCHEDULE] Event:", eventId);
  console.log("[SCHEDULE] Type:", type);
  console.log("=====================================");

  try {
    // 1️⃣ Validate type
    if (!type) {
      console.log("[SCHEDULE][ERROR] type missing");
      return res.status(400).json({ message: "Schedule type is required" });
    }

    if (!["KNOCKOUT", "LEAGUE_FINAL"].includes(type)) {
      console.log("[SCHEDULE][ERROR] invalid type:", type);
      return res.status(400).json({ message: "Invalid schedule type" });
    }

    // 2️⃣ Fetch event
    const event = await Event.findById(eventId);
    if (!event) {
      console.log("[SCHEDULE][ERROR] Event not found");
      return res.status(404).json({ message: "Event not found" });
    }

    console.log("[SCHEDULE] Event found:", event.name);

    // 3️⃣ Permission check
    const isAdmin = event.admin.map(id => id.toString()).includes(userId);
    const isManager = event.managers.map(id => id.toString()).includes(userId);

    console.log("[SCHEDULE] isAdmin:", isAdmin);
    console.log("[SCHEDULE] isManager:", isManager);

    if (!isAdmin && !isManager) {
      console.log("[SCHEDULE][ERROR] Unauthorized");
      return res.status(403).json({ message: "Not authorized" });
    }

    // 4️⃣ Check existing stages
    const existingStages = await Stage.find({ eventid: eventId });

    console.log("[SCHEDULE] Existing stages:", existingStages.length);

    if (existingStages.length > 0) {
      console.log("[SCHEDULE][ERROR] Schedule already exists");
      return res.status(400).json({
        message: "Schedule already generated"
      });
    }

    // ======================================================
    // 🟢 KNOCKOUT SCHEDULING
    // ======================================================
    if (type === "KNOCKOUT") {

      console.log("[KNOCKOUT] Fetching teams...");

      const teams = await Team.find({ eventid: eventId });

      console.log("[KNOCKOUT] Teams found:", teams.length);

      if (teams.length < 2) {
        console.log("[KNOCKOUT][ERROR] Not enough teams");
        return res.status(400).json({
          message: "At least 2 teams required"
        });
      }

      // Shuffle ONCE
      const shuffledTeams = shuffleArray(teams);
      const totalTeams = shuffledTeams.length;
      const baseSize = nearestPowerOfTwo(totalTeams);

      console.log("[KNOCKOUT] Teams shuffled");
      console.log("[KNOCKOUT] Base size:", baseSize);

      const createdStages = [];

      // -------------------------
      // PRELIMINARY ROUND
      // -------------------------
      if (totalTeams > baseSize) {
        const prelimMatchCount = totalTeams - baseSize;
        const prelimTeamsCount = prelimMatchCount * 2;

        console.log("[KNOCKOUT] Preliminary matches:", prelimMatchCount);

        const prelimTeams = shuffledTeams.slice(0, prelimTeamsCount);

        const prelimStage = await Stage.create({
          eventid: eventId,
          name: "Preliminary Round",
          type: "KNOCKOUT",
          order: 1,
          teams: prelimTeams.map(t => t._id)
        });

        console.log("[KNOCKOUT] Preliminary stage created:", prelimStage._id);

        const prelimMatches = [];

        for (let i = 0; i < prelimTeams.length; i += 2) {
          const teamA = prelimTeams[i];
          const teamB = prelimTeams[i + 1];

          console.log(
            `[KNOCKOUT][PRELIM MATCH] ${teamA.teamname} vs ${teamB.teamname}`
          );

          const match = await Match.create({
            eventid: eventId,
            stageid: prelimStage._id,
            matchType: "KNOCKOUT",
            teamA: { teamId: teamA._id },
            teamB: { teamId: teamB._id }
          });

          prelimMatches.push(match._id);
        }

        prelimStage.matches = prelimMatches;
        await prelimStage.save();

        createdStages.push(prelimStage);
      }

      // -------------------------
      // MAIN ROUNDS (STAGES)
      // -------------------------
      let roundTeams = baseSize;
      let order = createdStages.length + 1;

      while (roundTeams >= 2) {
        let name = "";

        if (roundTeams === 2) name = "Final";
        else if (roundTeams === 4) name = "Semi Final";
        else if (roundTeams === 8) name = "Quarter Final";
        else name = `Round of ${roundTeams}`;

        console.log("[KNOCKOUT] Creating stage:", name);

        const stage = await Stage.create({
          eventid: eventId,
          name,
          type: "KNOCKOUT",
          order
        });

        createdStages.push(stage);

        roundTeams /= 2;
        order++;
      }

      console.log("[KNOCKOUT] Stages created:", createdStages.length);

      // ======================================================
      // STEP 3: CREATE MATCHES
      // ======================================================
      console.log("[KNOCKOUT][STEP 3] Creating matches...");

      const stages = await Stage.find({ eventid: eventId })
        .sort({ order: 1 });

      const hasPreliminary = createdStages.some(
        s => s.name === "Preliminary Round"
      );

      let teamsQueue = [...shuffledTeams];

      for (const stage of stages) {

        console.log("[KNOCKOUT] Processing stage:", stage.name);

        let matches = [];

        // QUARTER FINAL (only if no prelim)
        if (stage.name === "Quarter Final" && !hasPreliminary) {

          console.log("[KNOCKOUT] Creating Quarter Final matches");

          for (let i = 0; i < teamsQueue.length; i += 2) {
            const teamA = teamsQueue[i];
            const teamB = teamsQueue[i + 1];

            console.log(
              `[QF MATCH] ${teamA.teamname} vs ${teamB.teamname}`
            );

            const match = await Match.create({
              eventid: eventId,
              stageid: stage._id,
              matchType: "KNOCKOUT",
              teamA: { teamId: teamA._id },
              teamB: { teamId: teamB._id }
            });

            matches.push(match._id);
          }
        }
        // SEMI & FINAL (placeholders)
        else {
          const matchCount =
            stage.name === "Semi Final" ? 2 :
            stage.name === "Final" ? 1 : 0;

          console.log(
            `[KNOCKOUT] Creating ${matchCount} placeholder matches for ${stage.name}`
          );

          for (let i = 0; i < matchCount; i++) {
            const match = await Match.create({
              eventid: eventId,
              stageid: stage._id,
              matchType: "KNOCKOUT",
              teamA: { teamId: null },
              teamB: { teamId: null }
            });

            matches.push(match._id);
          }
        }

        stage.matches = matches;
        await stage.save();

        console.log(
          `[KNOCKOUT] ${stage.name} matches created: ${matches.length}`
        );
      }

      console.log("[KNOCKOUT] Schedule generation completed");

      return res.status(201).json({
        message: "Knockout schedule created successfully",
        stages: createdStages.map(s => ({
          id: s._id,
          name: s.name
        }))
      });
    }
    // ======================================================
// 🟢 LEAGUE SCHEDULING (ROUND ROBIN)
// ======================================================
if (type === "LEAGUE_FINAL") {

  console.log("[LEAGUE] Fetching teams...");

  const teams = await Team.find({ eventid: eventId });

  console.log("[LEAGUE] Teams found:", teams.length);

  if (teams.length < 2) {
    console.log("[LEAGUE][ERROR] Not enough teams");
    return res.status(400).json({
      message: "At least 2 teams required for league"
    });
  }

  // 1️⃣ Create League Stage
  const leagueStage = await Stage.create({
    eventid: eventId,
    name: "League Stage",
    type: "LEAGUE",
    order: 1
  });

  console.log("[LEAGUE] League stage created:", leagueStage._id);

  // 2️⃣ Generate Round Robin Matches
  const matches = [];

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {

      const teamA = teams[i];
      const teamB = teams[j];

      console.log(
        `[LEAGUE MATCH] ${teamA.teamname} vs ${teamB.teamname}`
      );

      const match = await Match.create({
        eventid: eventId,
        stageid: leagueStage._id,
        matchType: "LEAGUE",
        teamA: { teamId: teamA._id, score: 0 },
        teamB: { teamId: teamB._id, score: 0 }
      });

      matches.push(match._id);
    }
  }

  // 3️⃣ Attach matches to stage
  leagueStage.matches = matches;
  await leagueStage.save();

  console.log("[LEAGUE] Total matches created:", matches.length);

  return res.status(201).json({
    message: "League schedule created successfully",
    stage: {
      id: leagueStage._id,
      name: leagueStage.name
    },
    totalTeams: teams.length,
    totalMatches: matches.length
  });
}


    // ======================================================
    // LEAGUE_FINAL (later)
    // ======================================================
    return res.status(200).json({
      message: "League scheduling will be implemented later"
    });

  } catch (error) {
    console.error("[SCHEDULE][CRITICAL]", error);
    return res.status(500).json({
      message: "Server error while generating schedule"
    });
  }
});
router.put("/matches/:matchId/teams", authenticate, async (req, res) => {
  const userId = req.user.id;
  const { matchId } = req.params;
  const { teamA, teamB } = req.body;

  console.log("=====================================");
  console.log("[ADMIN] Edit match teams");
  console.log("[ADMIN] User:", userId);
  console.log("[ADMIN] Match:", matchId);
  console.log("[ADMIN] New Teams:", teamA, teamB);
  console.log("=====================================");

  try {
    if (!teamA || !teamB) {
      return res.status(400).json({ message: "Both teams are required" });
    }

    if (teamA === teamB) {
      return res.status(400).json({ message: "Teams must be different" });
    }

    // 1️⃣ Fetch match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // 2️⃣ Match must be upcoming
    if (match.status !== "upcoming") {
      return res.status(400).json({
        message: "Cannot edit match after it has started"
      });
    }

    // 3️⃣ Fetch event
    const event = await Event.findById(match.eventid);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    // 🔒 Schedule lock check
if (event.isScheduleLocked) {
  return res.status(403).json({
    message: "Schedule is locked. Match editing not allowed."
  });
}


    // 4️⃣ Permission check
    const isAdmin = event.admin.map(id => id.toString()).includes(userId);
    const isManager = event.managers.map(id => id.toString()).includes(userId);

    if (!isAdmin && !isManager) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 5️⃣ Validate teams belong to this event
    const teamADoc = await Team.findById(teamA);
const teamBDoc = await Team.findById(teamB);

if (!teamADoc || !teamBDoc) {
  return res.status(404).json({ message: "Team not found" });
}

if (
  teamADoc.eventid.toString() !== match.eventid.toString() ||
  teamBDoc.eventid.toString() !== match.eventid.toString()
) {
  return res.status(400).json({
    message: "Teams do not belong to this event"
  });
}


    // 6️⃣ Update match
    match.teamA.teamId = teamA;
    match.teamB.teamId = teamB;

    await match.save();

    console.log("[ADMIN] Match teams updated successfully");

    return res.status(200).json({
      message: "Match teams updated",
      matchId: match._id
    });

  } catch (error) {
    console.error("[ADMIN][ERROR]", error);
    return res.status(500).json({
      message: "Server error while updating match"
    });
  }
});

router.put("/:eventId/lock-schedule", authenticate, async (req, res) => {
  const userId = req.user.id;
  const { eventId } = req.params;

  console.log("=====================================");
  console.log("[LOCK] Schedule lock request");
  console.log("[LOCK] User:", userId);
  console.log("[LOCK] Event:", eventId);
  console.log("=====================================");

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Admin only
    const isAdmin = event.admin.map(id => id.toString()).includes(userId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admin can lock schedule" });
    }

    // Schedule must exist
    const stagesCount = await Stage.countDocuments({ eventid: eventId });
    if (stagesCount === 0) {
      return res.status(400).json({
        message: "Cannot lock schedule before it is generated"
      });
    }

    // Already locked?
    if (event.isScheduleLocked) {
      return res.status(400).json({
        message: "Schedule is already locked"
      });
    }

    // Lock it
    event.isScheduleLocked = true;
    await event.save();

    console.log("[LOCK] Schedule locked successfully");

    return res.status(200).json({
      message: "Schedule locked successfully",
      eventId
    });

  } catch (error) {
    console.error("[LOCK][ERROR]", error);
    return res.status(500).json({
      message: "Server error while locking schedule"
    });
  }
});
router.put("/:matchId/status", authenticate, async (req, res) => {
  const userId = req.user.id;
  const { matchId } = req.params;
  const { status } = req.body;

  console.log("=====================================");
  console.log("[MATCH STATUS] Update request");
  console.log("[MATCH STATUS] User:", userId);
  console.log("[MATCH STATUS] Match:", matchId);
  console.log("[MATCH STATUS] New Status:", status);
  console.log("=====================================");

  try {
    // 1️⃣ Validate status
    if (!["live", "finished"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status update"
      });
    }

    // 2️⃣ Fetch match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // 3️⃣ Fetch event
    const event = await Event.findById(match.eventid);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 4️⃣ Schedule must be locked
    if (!event.isScheduleLocked) {
      return res.status(403).json({
        message: "Schedule must be locked before starting matches"
      });
    }

    // 5️⃣ Permission check
    const isAdmin = event.admin.map(id => id.toString()).includes(userId);
    const isManager = event.managers.map(id => id.toString()).includes(userId);

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        message: "Not authorized to update match status"
      });
    }

    // 6️⃣ Validate transition
    const currentStatus = match.status;

    if (currentStatus === "upcoming" && status !== "live") {
      return res.status(400).json({
        message: "Match must go live before finishing"
      });
    }

    if (currentStatus === "live" && status !== "finished") {
      return res.status(400).json({
        message: "Invalid match status transition"
      });
    }

    if (currentStatus === "finished") {
      return res.status(400).json({
        message: "Match already finished"
      });
    }

    // 7️⃣ Update status
    match.status = status;
    await match.save();

    console.log("[MATCH STATUS] Updated successfully");

    return res.status(200).json({
      message: "Match status updated",
      matchId,
      status
    });

  } catch (error) {
    console.error("[MATCH STATUS][ERROR]", error);
    return res.status(500).json({
      message: "Server error while updating match status"
    });
  }
});
router.put("/:matchId/result", authenticate, async (req, res) => {
  const userId = req.user.id;
  const { matchId } = req.params;
  const { winnerTeamId, isDraw, decidedBy } = req.body || {};

  console.log("=====================================");
  console.log("[MATCH RESULT] Declare result");
  console.log("[MATCH RESULT] User:", userId);
  console.log("[MATCH RESULT] Match:", matchId);
  console.log("[MATCH RESULT] Body:", req.body);
  console.log("=====================================");

  try {
    // 1️⃣ Fetch match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // 2️⃣ Match must be finished
    if (match.status !== "finished") {
      return res.status(400).json({
        message: "Match must be finished before declaring result"
      });
    }

    // 3️⃣ Result already declared
    if (match.winner || match.isDraw) {
      return res.status(400).json({
        message: "Match result already declared"
      });
    }

    // 4️⃣ Fetch event
    const event = await Event.findById(match.eventid);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 5️⃣ Schedule lock check
    if (!event.isScheduleLocked) {
      return res.status(403).json({
        message: "Schedule must be locked"
      });
    }

    // 6️⃣ Permission check
    const isAdmin = event.admin.map(id => id.toString()).includes(userId);
    const isManager = event.managers.map(id => id.toString()).includes(userId);

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        message: "Not authorized to declare result"
      });
    }

    // ==================================================
    // 🟡 DRAW CASE
    // ==================================================
    if (isDraw === true) {
      match.isDraw = true;
      match.decidedBy = decidedBy || "DRAW";
      await match.save();

      console.log("[MATCH RESULT] Draw recorded");

      return res.status(200).json({
        message: "Match declared as draw",
        matchId
      });
    }

    // ==================================================
    // 🟢 WINNER CASE
    // ==================================================
    if (!winnerTeamId) {
      return res.status(400).json({
        message: "winnerTeamId is required"
      });
    }

    // Winner must be one of the teams
    const teamA = match.teamA.teamId?.toString();
    const teamB = match.teamB.teamId?.toString();

    if (![teamA, teamB].includes(winnerTeamId)) {
      return res.status(400).json({
        message: "Winner must be one of the match teams"
      });
    }

    match.winner = winnerTeamId;
    match.decidedBy = decidedBy || "NORMAL";
    await match.save();
    // Auto progression (knockout only)
if (match.matchType === "KNOCKOUT") {
  await progressKnockoutWinner(match);
}

    console.log("[MATCH RESULT] Winner declared:", winnerTeamId);

    return res.status(200).json({
      message: "Match result declared",
      matchId,
      winnerTeamId
    });

  } catch (error) {
    console.error("[MATCH RESULT][ERROR]", error);
    return res.status(500).json({
      message: "Server error while declaring result"
    });
  }
});


/**
 * GET all stages with matches for an event
 */
router.get("/:eventId", authenticate, async (req, res) => {
  const { eventId } = req.params;

  console.log("=====================================");
  console.log("[STAGES] Fetch stages for event");
  console.log("[STAGES] Event:", eventId);
  console.log("=====================================");

  try {
    const stages = await Stage.find({ eventid: eventId })
      .sort({ order: 1 })
      .populate({
        path: "matches",
        populate: [
          {
            path: "teamA.teamId",
            select: "teamname"
          },
          {
            path: "teamB.teamId",
            select: "teamname"
          }
        ]
      });

    console.log("[STAGES] Stages found:", stages.length);

    return res.status(200).json(stages);
  } catch (error) {
    console.error("[STAGES][ERROR]", error);
    return res.status(500).json({
      message: "Failed to fetch stages"
    });
  }
});

// ---------------------------------------------------
// GET STAGES + MATCHES FOR EVENT (READ API)
// ---------------------------------------------------
router.get("/:eventId/stages", authenticate, async (req, res) => {
  const { eventId } = req.params;

  console.log("=====================================");
  console.log("[STAGES] Fetch stages for event");
  console.log("[STAGES] Event:", eventId);
  console.log("=====================================");

  try {
    const stages = await Stage.find({ eventid: eventId })
      .sort({ order: 1 })
      .populate({
        path: "matches",
        populate: [
          {
            path: "teamA.teamId",
            select: "teamname"
          },
          {
            path: "teamB.teamId",
            select: "teamname"
          }
        ]
      });

    console.log("[STAGES] Stages found:", stages.length);

    return res.status(200).json(stages);
  } catch (error) {
    console.error("[STAGES][ERROR]", error);
    return res.status(500).json({
      message: "Failed to fetch stages"
    });
  }
});
// GET SINGLE MATCH
router.get("/matches/:matchId", authenticate, async (req,res)=>{
  const { matchId } = req.params;

  console.log("[MATCH READ] Fetch match:", matchId);

  try {
    const match = await Match.findById(matchId)
      .populate("teamA.teamId","teamname")
      .populate("teamB.teamId","teamname");

    if(!match){
      return res.status(404).json({message:"Match not found"});
    }

    return res.json(match);
  } catch(err){
    console.error("[MATCH READ ERROR]",err);
    return res.status(500).json({message:"Server error"});
  }
});

// GET FINAL WINNER
router.get("/:eventId/winner", authenticate, async (req,res)=>{
  const { eventId } = req.params;

  const finalStage = await Stage.findOne({
    eventid:eventId,
    name:"Final"
  }).populate({
    path:"matches",
    populate:[
      {path:"winner",select:"teamname"}
    ]
  });

  if(!finalStage || finalStage.matches.length===0){
    return res.json({winner:null});
  }

  const finalMatch = finalStage.matches[0];

  return res.json({
    winner: finalMatch.winner
  });
});

export default router;