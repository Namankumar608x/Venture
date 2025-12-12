// test-find-event.cjs
require('dotenv').config();
const mongoose = require('mongoose');

// require the file and grab .default if present (works for both CJS and ESM default export)
let EventMod = require('./src/models/events.js');
if (EventMod && EventMod.default) EventMod = EventMod.default;
const Event = EventMod;

const MONGO_URI = process.env.MONGO_URI || process.env.DB_URI || 'mongodb://127.0.0.1:27017/venture';
const eventId = '69392e6c4d001f407afcfc94';

(async () => {
  try {
    console.log("Connecting to:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected, now querying Event.findById:", eventId);
    const ev = await Event.findById(eventId).lean();
    if (!ev) {
      console.log("RESULT: event NOT found for id:", eventId);
      const recent = await Event.find({}).sort({ createdAt: -1 }).limit(10).select('_id name admin createdAt').lean();
      console.log("Recent events (up to 10):");
      console.log(JSON.stringify(recent, null, 2));
    } else {
      console.log("RESULT: event found:", ev._id.toString());
      console.log("name:", ev.name);
      console.log("admin:", ev.admin);
      console.log("managers:", ev.managers);
      console.log("createdAt:", ev.createdAt);
    }
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await mongoose.connection.close();
    console.log("Done.");
  }
})();
