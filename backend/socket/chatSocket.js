import { MessageModel } from "../models/messageModel.js";
import { WeddingModel } from "../models/weddingModel.js";
import { GuestModel } from "../models/guestModel.js";
import { ConciergeBotService } from "../services/conciergeBotService.js";

/**
 * Standard Helper to normalize wedding room ID
 */
export const getCleanWeddingId = (weddingId) => {
  if (!weddingId) return "wedding_01";
  return String(weddingId).replace(/^wedding:/, "").trim() || "wedding_01";
};

export const getWeddingRoom = (weddingId) => getCleanWeddingId(weddingId);

/**
 * Helper to authenticate token if needed for REST routes
 */
export async function authenticate(auth) {
  if (!auth) return null;
  const token = typeof auth === "string" ? auth : auth?.token;
  if (!token) return null;

  const raw = String(token).replace(/^Bearer\s+/, "").trim();
  if (raw.includes("admin") || raw === "user_admin_01") {
    return { id: "user_admin_01", name: "Manish (Admin)", role: "admin", weddingId: null };
  }
  if (raw.includes("call_center") || raw.includes("callcenter")) {
    return { id: "user_agent_01", name: "Sarah (Call Desk)", role: "admin", weddingId: null };
  }
  return { id: "client_user", name: "Client", role: "client", weddingId: "wedding_01" };
}

/**
 * Standard Socket.IO Chat Implementation
 * Handles real-time client-to-admin communication with database persistence.
 */
export const initializeChatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 [Socket Connected] ID: ${socket.id}`);

    // Automatically join admins room if user claims admin or role passed in auth
    const authRole = socket.handshake.auth?.role || socket.handshake.query?.role;
    if (authRole === "admin") {
      socket.join("admins");
      console.log(`💬 Socket ${socket.id} joined admins channel`);
    }

    // 1. Join a wedding conversation room
    const handleJoinRoom = (weddingId, ack) => {
      const room = getCleanWeddingId(weddingId);
      socket.join(room);
      socket.data.weddingId = room;
      console.log(`💬 Socket ${socket.id} joined room: ${room}`);
      if (typeof ack === "function") ack({ success: true, room });
    };

    socket.on("join_room", handleJoinRoom);
    socket.on("join_wedding", handleJoinRoom);

    // 2. Admin channel join
    socket.on("join_admin", (ack) => {
      socket.join("admins");
      console.log(`💬 Socket ${socket.id} joined admins channel`);
      if (typeof ack === "function") ack({ success: true, room: "admins" });
    });

    // 3. Leave room
    socket.on("leave_room", (weddingId, ack) => {
      const room = getCleanWeddingId(weddingId || socket.data.weddingId);
      socket.leave(room);
      if (typeof ack === "function") ack({ success: true });
    });

    // 4. Send Message (Standard Socket.IO chat event)
    const handleSendMessage = async (payload, ack) => {
      try {
        const rawText = typeof payload === "string" ? payload : payload?.message || payload?.text || "";
        const cleanText = String(rawText).trim();
        if (!cleanText) {
          return ack?.({ success: false, error: "Message cannot be empty" });
        }

        const weddingId = getCleanWeddingId(
          typeof payload === "object" ? payload?.wedding_id || payload?.weddingId || socket.data.weddingId : socket.data.weddingId
        );

        const senderId = payload?.sender_id || (payload?.sender_role === "admin" ? "admin" : "client");
        const senderName = payload?.sender_name || (payload?.sender_role === "admin" ? "Manish (Admin)" : "Client");
        const senderRole = payload?.sender_role || "client";

        // 1. Permanently save in DB (Supabase + local store backup)
        const savedMsg = await MessageModel.create({
          wedding_id: weddingId,
          sender_id: senderId,
          sender_name: senderName,
          sender_role: senderRole,
          message: cleanText,
        });

        console.log(`💬 [Message Saved & Emitted] (${senderRole}) ${senderName} in ${weddingId}: "${cleanText}"`);

        // 2. Broadcast live to the wedding room AND to all admins
        io.to(weddingId).emit("receive_message", savedMsg);
        io.to("admins").emit("receive_message", savedMsg);

        // Also emit legacy "message" & "new_message" for complete client compatibility
        io.to(weddingId).emit("message", savedMsg);
        io.to("admins").emit("message", savedMsg);
        io.to(weddingId).emit("new_message", savedMsg);
        io.to("admins").emit("new_message", savedMsg);

        // 3. Return acknowledgment to sender
        if (typeof ack === "function") {
          ack({ success: true, ok: true, data: savedMsg });
        }

        // 4. Trigger Concierge Bot reply if message came from a wedding client
        if (senderRole !== "admin") {
          setTimeout(async () => {
            try {
              const wedding = await WeddingModel.getById(weddingId);
              const guests = await GuestModel.getByWeddingId(weddingId).catch(() => []);
              const botReplyText = ConciergeBotService.generateReply({
                wedding,
                guests: guests || [],
                message: cleanText,
                senderName: senderName,
              });

              const botMsg = await MessageModel.create({
                wedding_id: weddingId,
                sender_id: "emitly_bot",
                sender_name: "Emitly Bot Concierge",
                sender_role: "bot",
                message: botReplyText,
              });

              io.to(weddingId).emit("receive_message", botMsg);
              io.to("admins").emit("receive_message", botMsg);
              io.to(weddingId).emit("message", botMsg);
              io.to("admins").emit("message", botMsg);
              io.to(weddingId).emit("new_message", botMsg);
              io.to("admins").emit("new_message", botMsg);
            } catch (botErr) {
              console.warn("Notice: Concierge bot reply:", botErr.message);
            }
          }, 600);
        }
      } catch (err) {
        console.error("Socket send message error:", err);
        if (typeof ack === "function") {
          ack({ success: false, ok: false, error: err.message });
        }
      }
    };

    socket.on("send_message", handleSendMessage);
    socket.on("message", handleSendMessage);

    // 5. User Typing Indicator
    socket.on("typing", (data) => {
      const room = getCleanWeddingId(data?.wedding_id || socket.data.weddingId);
      const payload = {
        user_name: data?.sender_name || data?.user_name || "Someone",
        is_typing: Boolean(data?.is_typing),
        wedding_id: room,
      };
      socket.to(room).emit("user_typing", payload);
      socket.to("admins").emit("user_typing", payload);
    });

    // 6. Mark messages as read in DB and broadcast update
    socket.on("mark_read", async (data, ack) => {
      const room = getCleanWeddingId(data?.wedding_id || socket.data.weddingId);
      const readerRole = data?.reader_role || "client";
      try {
        await MessageModel.markAsRead(room, readerRole);
        io.to(room).emit("messages_read", { wedding_id: room, reader_role: readerRole });
        io.to("admins").emit("messages_read", { wedding_id: room, reader_role: readerRole });
        if (typeof ack === "function") ack({ success: true, ok: true });
      } catch (e) {
        if (typeof ack === "function") ack({ success: false, ok: false });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 [Socket Disconnected] ID: ${socket.id} (${reason})`);
    });
  });
};

export default initializeChatSocket;
