import mongoose from "mongoose";

const eventSchema=new mongoose.Schema({
      name:{type:String,required:true},
      description:{type:String},
  admin:[{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}],
  managers:[{type:mongoose.Schema.Types.ObjectId,ref:"User",default:[]}],
  players:[{type:mongoose.Schema.Types.ObjectId,ref:"User",default:[]}],
  club:{type:mongoose.Schema.Types.ObjectId,ref:"Club",required:true},
  // Event updates (announcements, notices, schedule, results)
    updates: [
        {
            message: String,
            createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    // Match/round scheduling
    schedule: [
        {
            title: String,    // "Pre-Qualifiers", "Round 1", etc.
            date: Date,
            time: String,
            location: String,
            description: String
        }
    ],
     liveScore: {
        enabled: { type: Boolean, default: false },
        scoreData: {
            teamA: String,
            teamB: String,
            scoreA: { type: Number, default: 0 },
            scoreB: { type: Number, default: 0 },
            lastUpdated: Date
        }
    },
        qualifiedPlayers: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            round: String,   // "prequalifier", "qualifier", "semi-final", etc.
            qualifiedAt: Date
        }
    ],
    
    // Player bidding system
    auction: {
        enabled: { type: Boolean, default: false },
        basePrice: Number,
        bids: [
            {
                player: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                bidder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                amount: Number,
                time: Date
            }
        ]
    },

    // Private chats between user & admins/managers
    queries: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            messages: [
                {
                    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                    text: String,
                    time: Date
                }
            ]
        }
    ]
},{timestamps:true});

const eventModel=mongoose.model("Event",eventSchema);
export default eventModel;
