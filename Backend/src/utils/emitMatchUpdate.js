export function emitMatchEvent(io, eventId, type, payload) {
  if (!io) {
    console.warn("[MATCH SOCKET EMIT] io missing");
    return;
  }

  console.log("=====================================");
  console.log("[MATCH SOCKET EMIT]");
  console.log("Type:", type);
  console.log("Event ID:", eventId);
  console.log("Payload:", payload);
  console.log("Target room:", `event:${eventId}`);
  console.log("=====================================");

  // 🔥 ALWAYS emit live events to event room
  io.to(`event:${eventId}`).emit(type, payload);
}
