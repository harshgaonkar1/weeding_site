import { io } from "socket.io-client";
import { BACKEND_SERVER_URL } from "../config/apiConfig";

const URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  BACKEND_SERVER_URL ||
  "http://localhost:5000";

/**
 * Target Architecture Rule 1:
 * The socket instance is created once, outside components, with autoConnect: false.
 * Set socket.auth = { token } from existing auth BEFORE calling socket.connect().
 */
export const socket = io(URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 30,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

/**
 * Accessor helper to return the singleton socket instance
 */
export const getSocket = () => socket;

/**
 * Join a specific wedding's real-time chat room (Admin only in target architecture)
 */
export const joinWeddingChat = (weddingId, ack) => {
  if (!weddingId) return;
  socket.emit("join_wedding", weddingId, ack);
};

/**
 * Leave a wedding's chat room
 */
export const leaveWeddingChat = (weddingId, ack) => {
  if (!weddingId) return;
  socket.emit("leave_wedding", weddingId, ack);
};

/**
 * Send a message via Socket.IO
 * Emits "message" event matching target architecture
 */
export const sendSocketMessage = (text, callback) => {
  const cleanText = typeof text === "string" ? text : (text?.message || text?.text || "");
  socket.emit("message", cleanText, (response) => {
    if (typeof callback === "function") {
      callback(response);
    }
  });
  return true;
};

/**
 * Emit user typing status
 */
export const emitTyping = (weddingId, userName, isTyping) => {
  if (!weddingId) return;
  socket.emit("typing", {
    wedding_id: weddingId,
    user_name: userName,
    is_typing: isTyping,
  });
};

/**
 * Mark messages as read via Socket.IO
 */
export const markSocketMessagesRead = (weddingId, readerRole = "client") => {
  if (!weddingId) return;
  socket.emit("mark_read", { wedding_id: weddingId, reader_role: readerRole });
};

export default socket;
