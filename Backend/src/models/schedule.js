import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
    title: String,
    date: Date,
    time: String,
    location: String,
    description: String,
    regteams:[{type: mongoose.Schema.Types.ObjectId, ref:"Team"}],
    eventid:{ type: mongoose.Schema.Types.ObjectId, ref:"Event",required: true },
}, { timestamps: true });

export default mongoose.model("Schedule",scheduleSchema);
