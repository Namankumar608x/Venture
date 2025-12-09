import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongo from "./src/db/mongo.js";
import home from "./src/routes/home.js";
import auth from "./src/routes/auth.js";
import club from "./src/routes/clubs.js";
import event from "./src/routes/event.js";
const app=express();
app.use(express.json());
dotenv.config();
const PORT=5005;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // mobile apps send no origin
    if (
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.includes("192.168.") // allow all local IPs
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
mongo();

app.use("/",home);
app.use("/auth",auth);
app.use("/clubs",club);
app.use("/event",event);

app.listen(PORT,()=>{
    console.log(`server running on: ${PORT}`);
   
})