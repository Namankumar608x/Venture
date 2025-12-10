import jwt from "jsonwebtoken";

export default function setupSocket(io) {
  const ACCESS_SECRET = process.env.ACCESS_SECRET || "ava";

  // Authenticate every socket connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake?.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: token missing"));
      }

      // Verify JWT
      jwt.verify(token, ACCESS_SECRET, (err, payload) => {
        if (err) {
          return next(new Error("Authentication error: invalid token"));
        }

        socket.user = payload;  // same as req.user in REST
        next();
      });
    } catch (err) {
      console.error("Socket Auth Error:", err);
      return next(new Error("Authentication failed"));
    }
  });

  // When a socket connects
  io.on("connection", (socket) => {
    console.log(`[SOCKET] Connected: ${socket.id}, user: ${socket.user?.id}`);

    // Join an event room
    socket.on("join:event", ({ eventId }) => {
      if (!eventId) return;
      const room = `event:${eventId}`;
      socket.join(room);

      console.log(`[SOCKET] User ${socket.user.id} joined room: ${room}`);

      socket.to(room).emit("presence:joined", {
        user: { id: socket.user.id, username: socket.user.username },
        eventId,
      });
    });

    // Leave event room
    socket.on("leave:event", ({ eventId }) => {
      if (!eventId) return;
      const room = `event:${eventId}`;
      socket.leave(room);

      console.log(`[SOCKET] User ${socket.user.id} left room: ${room}`);

      socket.to(room).emit("presence:left", {
        user: { id: socket.user.id, username: socket.user.username },
        eventId,
      });
    });

    // Ping test
    socket.on("ping:test", (data, ack) => {
      ack?.({
        ok: true,
        message: "Pong from server!",
        serverTime: new Date().toISOString(),
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`[SOCKET] Disconnected: ${socket.id} — ${reason}`);
    });
  });
}
