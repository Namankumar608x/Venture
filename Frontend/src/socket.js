import { io } from "socket.io-client";

const BACKEND_URL =
  `${window.location.protocol}//${window.location.hostname}:5005`;

let socket = null;

export const getSocket = () => {
  if (!socket) {
    console.log("🧩 [SOCKET] creating singleton socket");

    socket = io(BACKEND_URL, {
      transports: ["websocket"],
      auth: {
        token: localStorage.getItem("accessToken"),
      },
    });

    socket.on("connect", () => {
      console.log("🟢 [SOCKET] connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.warn("🔴 [SOCKET] disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ [SOCKET] connect_error:", err.message);
    });
  }

  return socket;
};
