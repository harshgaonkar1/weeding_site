import { io } from "socket.io-client";
import { BACKEND_SERVER_URL } from "../config/apiConfig";

export const socket = io(BACKEND_SERVER_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

export const getSocket = () => socket;

export const joinWeddingChat = (weddingId) => {
  if (!weddingId) return;
  const cleanId = String(weddingId).replace(/^wedding:/, "").trim();
  socket.emit("join_room", cleanId);
};

export const leaveWeddingChat = (weddingId) => {
  if (!weddingId) return;
  const cleanId = String(weddingId).replace(/^wedding:/, "").trim();
  socket.emit("leave_room", cleanId);
};

export const sendSocketMessage = (payload, callback) => {
  socket.emit("send_message", payload, callback);
};

export const emitTyping = (weddingId, userName, isTyping) => {
  if (!weddingId) return;
  const cleanId = String(weddingId).replace(/^wedding:/, "").trim();
  socket.emit("typing", {
    wedding_id: cleanId,
    sender_name: userName,
    is_typing: isTyping,
  });
};

export const markSocketMessagesRead = (weddingId, readerRole = "client") => {
  if (!weddingId) return;
  const cleanId = String(weddingId).replace(/^wedding:/, "").trim();
  socket.emit("mark_read", { wedding_id: cleanId, reader_role: readerRole });
};

export default socket;
