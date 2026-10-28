import { MessageModel } from "../models/messageModel.js";
import { WeddingModel } from "../models/weddingModel.js";
import { GuestModel } from "../models/guestModel.js";
import { ConciergeBotService } from "../services/conciergeBotService.js";
import { store } from "../Db_connection/queries.js";

/**
 * Initialize Socket.IO event listeners for Real-Time Wedding Chat & Bot Concierge
 * @param {import("socket.io").Server} io
 */
export const initializeChatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket client connected: ${socket.id}`);

    // Join wedding-specific chat room
    socket.on("join_wedding", (weddingId) => {
      if (!weddingId) return;
      const room = `wedding_${weddingId}`;
      socket.join(room);
      console.log(`💬 Socket ${socket.id} joined room: ${room}`);
    });

    // Leave wedding chat room
    socket.on("leave_wedding", (weddingId) => {
      if (!weddingId) return;
      const room = `wedding_${weddingId}`;
      socket.leave(room);
    });

    // Fetch messages via Socket.IO (0ms roundtrip, avoids HTTP preflight & 502)
    socket.on("get_messages", async (weddingId, callback) => {
      try {
        const safeWeddingId = weddingId || "wedding_01";
        const messages = await MessageModel.getByWeddingId(safeWeddingId);
        if (typeof callback === "function") {
          callback({ success: true, data: messages });
        }
      } catch (err) {
        if (typeof callback === "function") {
          callback({ success: false, data: [] });
        }
      }
    });

    // Send a message via Socket.IO
    socket.on("send_message", async (data, callback) => {
      try {
        const { wedding_id, sender_id, sender_name, sender_role, message, trigger_bot_reply } = data || {};
        const safeWeddingId = wedding_id || "wedding_01";
        if (!message || !message.trim()) {
          if (typeof callback === "function") callback({ error: "message is required" });
          return;
        }

        const role = sender_role || "client";
        const room = `wedding_${safeWeddingId}`;

        // 1. Instantly save in-memory & Supabase DB
        const savedMsg = await MessageModel.create({
          wedding_id: safeWeddingId,
          sender_id,
          sender_name,
          sender_role: role,
          message: message.trim(),
        });

        // 2. Broadcast new message immediately to everyone in this wedding's room
        io.to(room).emit("new_message", savedMsg);

        if (typeof callback === "function") callback({ success: true, data: savedMsg });

        // 3. Automated Concierge Bot response if message is from client/user or trigger_bot_reply is set
        if (role !== "admin" || trigger_bot_reply) {
          try {
            // Natural 350ms delay for authentic conversation feel
            setTimeout(async () => {
              try {
                // Fast in-memory lookup (<1ms)
                let wedding = (store && Array.isArray(store.weddings))
                  ? store.weddings.find((w) => w.id === safeWeddingId)
                  : null;
                let guests = (store && Array.isArray(store.guests))
                  ? store.guests.filter((g) => g.wedding_id === safeWeddingId)
                  : [];

                if (!wedding) {
                  wedding = await Promise.race([
                    WeddingModel.getById(safeWeddingId),
                    new Promise((r) => setTimeout(() => r(null), 400)),
                  ]).catch(() => null);
                }

                const botReplyText = ConciergeBotService.generateReply({
                  wedding,
                  guests: guests || [],
                  message: message.trim(),
                  senderName: sender_name,
                });

                // Save bot response in Supabase DB & local store
                const savedBotMsg = await MessageModel.create({
                  wedding_id: safeWeddingId,
                  sender_id: "emitly_bot",
                  sender_name: "Emitly Bot Concierge",
                  sender_role: "bot",
                  message: botReplyText,
                });

                // Broadcast bot reply to the wedding room
                io.to(room).emit("new_message", savedBotMsg);
              } catch (botErr) {
                console.warn("Notice: Concierge bot socket reply note:", botErr.message);
              }
            }, 350);
          } catch (e) {}
        }
      } catch (err) {
        console.error("Socket send_message error:", err);
        if (typeof callback === "function") callback({ error: err.message });
      }
    });

    // Mark messages as read
    socket.on("mark_read", async ({ wedding_id, reader_role }) => {
      if (!wedding_id) return;
      try {
        await MessageModel.markAsRead(wedding_id, reader_role || "client");
        io.to(`wedding_${wedding_id}`).emit("messages_read", { wedding_id, reader_role });
      } catch (e) {}
    });

    // User typing indicator
    socket.on("typing", ({ wedding_id, user_name, is_typing }) => {
      if (!wedding_id) return;
      socket.to(`wedding_${wedding_id}`).emit("user_typing", { user_name, is_typing });
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket client disconnected: ${socket.id} (${reason})`);
    });
  });
};

export default initializeChatSocket;
