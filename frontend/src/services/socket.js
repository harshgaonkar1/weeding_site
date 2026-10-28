import { io } from "socket.io-client";
import { BACKEND_SERVER_URL } from "../config/apiConfig";

let socket = null;

/**
 * Get or create the singleton Socket.IO connection to the backend server.
 */
export const getSocket = () => {
  if (!socket) {
    const serverUrl = BACKEND_SERVER_URL || "http://localhost:5000";

    socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("🟢 Socket.IO connected to backend:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Socket.IO connect error notice:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket.IO disconnected:", reason);
    });
  }

  // If disconnected, reconnect
  if (socket && !socket.connected) {
    socket.connect();
  }

  return socket;
};

/**
 * Join a specific wedding's real-time chat room
 */
export const joinWeddingChat = (weddingId) => {
  if (!weddingId) return;
  const s = getSocket();
  if (s) {
    s.emit("join_wedding", weddingId);
  }
};

/**
 * Leave a wedding's chat room
 */
export const leaveWeddingChat = (weddingId) => {
  if (!weddingId) return;
  const s = getSocket();
  if (s) {
    s.emit("leave_wedding", weddingId);
  }
};

/**
 * Send a message via Socket.IO
 */
export const sendSocketMessage = (messageData, callback) => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit("send_message", messageData, callback);
    return true;
  }
  return false;
};

/**
 * Mark messages as read via Socket.IO
 */
export const markSocketMessagesRead = (weddingId, readerRole = "client") => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit("mark_read", { wedding_id: weddingId, reader_role: readerRole });
  }
};

/**
 * Emit user typing status
 */
export const emitTyping = (weddingId, userName, isTyping) => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit("typing", { wedding_id: weddingId, user_name: userName, is_typing: isTyping });
  }
};

export default getSocket;

