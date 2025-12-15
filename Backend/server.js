import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongo from "./src/db/mongo.js";
import http from "http";
import { Server as IOServer } from "socket.io";
import setupSocket from "./src/sockets/index.js";
import notifications from "./src/routes/notification.js";
import home from "./src/routes/home.js";
import auth from "./src/routes/auth.js";
import club from "./src/routes/clubs.js";
import event from "./src/routes/event.js";
import teams from "./src/routes/team.js";
import schedule from "./src/routes/schedule.js";
import extra from "./src/routes/extra.js";
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 5005;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.includes("192.168.")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

mongo();

app.use("/extra", extra);
app.use("/auth", auth);
app.use("/clubs", club);
app.use("/events", event);
app.use("/teams",teams);
app.use("/schedule", schedule);
app.use("/notifications", notifications);
const httpServer = http.createServer(app);

const io = new IOServer(httpServer, {
  cors: {
    origin: [/localhost/, /127\.0\.0\.1/, /192\.168\./],
    credentials: true,
  },
});

// Make io available to REST route handlers via req.app.locals.io
app.locals.io = io;
app.use((req, res, next) => {
  req.io = io;
  next();
});

setupSocket(io);

httpServer.listen(PORT, () => {
  console.log("Server running on:", PORT);
});
