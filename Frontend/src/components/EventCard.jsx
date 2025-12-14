// EventCard.jsx
import React from "react";

const leaveEvent = async (eventId) => {
  if (!window.confirm("Are you sure you want to leave this event?")) return;

  try {
    const config = getAuthConfig();
    if (!config) return;

    await axios.post(
      "http://localhost:5005/events/leave",
      { eventid: eventId },
      config
    );

    const events = await fetchEventsForClub(selectedClub);
    setClubEvents(events);
  } catch (err) {
    alert(err.response?.data?.message || "Failed to leave event");
  }
};
function EventCard({ event, onOpen }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 flex justify-between items-center text-sm text-slate-100">
      <div>
        <div className="font-medium">{event.name || "Unnamed Event"}</div>
        <div className="text-xs text-slate-400">ID: {event._id || event.id}</div>
      </div>
      <div className="flex gap-2">
      
        <button onClick={onOpen} className="text-xs px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white">
          Open
        </button>
      </div>
    </div>
  );
}

export default EventCard;
