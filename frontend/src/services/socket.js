import { io } from "socket.io-client";
import { BACKEND_SERVER_URL } from "../config/apiConfig";

let socket = null;
let currentJoinedWeddingId = null;

/**
 * Get or create the singleton Socket.IO connection to the backend server.
 * Configured according to official Socket.IO v4 production guidelines:
 * - Prioritizes native WebSockets over polling to eliminate HTTP CORS/502 preflight issues
 * - Clean reconnection backoff so sleeping cloud containers (e.g. Render) can boot
 * - Automatic room re-join upon reconnection
 */
export const getSocket = () => {
  if (!socket) {
    const serverUrl = BACKEND_SERVER_URL || "http://localhost:5000";

    socket = io(serverUrl, {
      autoConnect: true,
      // Try WebSocket first; fall back to polling only if WebSocket fails
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
    });

    socket.on("connect", () => {
      console.log("🟢 Socket.IO connected via", socket.io?.engine?.transport?.name, "| ID:", socket.id);
      // Auto-rejoin wedding chat room if previously joined
      if (currentJoinedWeddingId) {
        socket.emit("join_wedding", currentJoinedWeddingId);
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Socket.IO connect error notice:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket.IO disconnected:", reason);
      if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, reconnect manually
        socket.connect();
      }
    });
  }

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
  currentJoinedWeddingId = weddingId;
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
  if (currentJoinedWeddingId === weddingId) {
    currentJoinedWeddingId = null;
  }
  const s = getSocket();
  if (s) {
    s.emit("leave_wedding", weddingId);
  }
};

/**
 * Send a message via Socket.IO - buffers in-memory if temporarily disconnected
 * and returns true if socket is available.
 */
export const sendSocketMessage = (messageData, callback) => {
  const s = getSocket();
  if (!s) return false;

  s.emit("send_message", messageData, (response) => {
    if (typeof callback === "function") {
      callback(response);
    }
  });

  return true;
};

/**
 * Async send message with promise resolution and acknowledgement timeout
 */
export const sendSocketMessageAsync = (messageData, timeoutMs = 8000) => {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    if (!s) return reject(new Error("Socket not initialized"));

    let timer;
    const ackCallback = (response) => {
      clearTimeout(timer);
      if (response && response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response?.data || response);
      }
    };

    timer = setTimeout(() => {
      reject(new Error("Socket send timeout"));
    }, timeoutMs);

    s.emit("send_message", messageData, ackCallback);
  });
};

/**
 * Fetch message history via active Socket.IO connection (no HTTP fetch)
 * Waits up to timeoutMs for the connection to establish before giving up.
 */
export const fetchSocketMessages = (weddingId, timeoutMs = 3500) => {
  return new Promise((resolve) => {
    const s = getSocket();
    if (!s) return resolve(null);

    let timer;
    const handleResponse = (response) => {
      clearTimeout(timer);
      if (response && response.success && Array.isArray(response.data)) {
        resolve(response.data);
      } else {
        resolve(null);
      }
    };

    timer = setTimeout(() => resolve(null), timeoutMs);

    if (s.connected) {
      s.emit("get_messages", weddingId, handleResponse);
    } else {
      s.once("connect", () => {
        s.emit("get_messages", weddingId, handleResponse);
      });
      s.connect();
    }
  });
};

/**
 * Mark messages as read via Socket.IO
 */
export const markSocketMessagesRead = (weddingId, readerRole = "client") => {
  const s = getSocket();
  if (s) {
    s.emit("mark_read", { wedding_id: weddingId, reader_role: readerRole });
  }
};

/**
 * Emit user typing status
 */
export const emitTyping = (weddingId, userName, isTyping) => {
  const s = getSocket();
  if (s) {
    s.emit("typing", { wedding_id: weddingId, user_name: userName, is_typing: isTyping });
  }
};

export default getSocket;
