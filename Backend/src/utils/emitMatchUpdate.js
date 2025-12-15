export function emitMatchEvent(io, eventId, type, payload) {
  console.log(
    "[MATCH SOCKET EMIT]",
    type,
    "→ event:",
    `event:${eventId}`,
    "→ organizers:",
    `event-organizers:${eventId}`
  );

  // Audience / participants
  io.to(`event:${eventId}`).emit(type, payload);

  // Admins / managers
  io.to(`event-organizers:${eventId}`).emit(type, payload);
}
