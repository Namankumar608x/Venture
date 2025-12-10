import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongo from "./src/db/mongo.js";
import http from "http";
import { Server as IOServer } from "socket.io";
import setupSocket from "./src/sockets/index.js";

import home from "./src/routes/home.js";
import auth from "./src/routes/auth.js";
import club from "./src/routes/clubs.js";
import event from "./src/routes/event.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 5005;

// CORS (your existing config)
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

// REST routes
app.use("/", home);
app.use("/auth", auth);
app.use("/clubs", club);
app.use("/event", event);

// Create HTTP server for both Express & Socket.IO
const httpServer = http.createServer(app);

// Create socket.io instance
const io = new IOServer(httpServer, {
  cors: {
    origin: [/localhost/, /127\.0\.0\.1/, /192\.168\./],
    credentials: true,
  },
});

// Initialize socket handlers
setupSocket(io);

httpServer.listen(PORT, () => {
  console.log("Server running on:", PORT);
});
