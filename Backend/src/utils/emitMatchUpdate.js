export function emitMatchEvent(io, eventId, type, payload) {
  io.to(`event:${eventId}`).emit(type, payload);
}
