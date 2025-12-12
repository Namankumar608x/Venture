// check-event.cjs
require('dotenv').config();
const mongoose = require('mongoose');

let EventMod = require('./src/models/events.js');
if (EventMod && EventMod.default) EventMod = EventMod.default;
const Event = EventMod;

(async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.DB_URI || 'mongodb://127.0.0.1:27017/venture';
    console.log("Connecting to:", uri);
    await mongoose.connect(uri);
    console.log("Event model name:", Event.modelName || "(unknown)");
    try { console.log("Event collection name:", Event.collection && Event.collection.name); } catch (e) {}
    const id = '6937ea0100f57c798cbfbebe';
    console.log("Looking for Event._id =", id);
    const e = await Event.findById(id).lean();
    if (!e) {
      console.log("-> NOT FOUND");
      const recent = await Event.find({}).sort({ createdAt: -1 }).limit(10).select('_id name club admin createdAt').lean();
      console.log("Recent events (up to 10):", JSON.stringify(recent, null, 2));
    } else {
      console.log("-> FOUND event:");
      console.log(JSON.stringify(e, null, 2));
    }
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await mongoose.connection.close();
    console.log("Done");
  }
})();
