// inspect-club.cjs
require('dotenv').config();
const mongoose = require('mongoose');
let ClubMod = require('./src/models/club.js');
if (ClubMod && ClubMod.default) ClubMod = ClubMod.default;
const Club = ClubMod;

(async ()=>{
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const id = '6937dd9256f198f747fd931b'; // your club id
    const c = await Club.findById(id).lean();
    console.log(JSON.stringify(c, null, 2));
  } catch (e) { console.error(e); }
  finally { await mongoose.connection.close(); }
})();
