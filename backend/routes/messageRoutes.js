import express from "express";
import { MessageModel } from "../models/messageModel.js";
import { WeddingModel } from "../models/weddingModel.js";
import { GuestModel } from "../models/guestModel.js";
import { ConciergeBotService } from "../services/conciergeBotService.js";
import { store } from "../Db_connection/queries.js";

const router = express.Router();

// 1. Get all messages for a specific wedding
router.get("/:weddingId", async (req, res) => {
  try {
    const { weddingId } = req.params;
    const messages = await MessageModel.getByWeddingId(weddingId);
    res.json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wedding messages",
      error: error.message,
    });
  }
});

// 2. Post a new message (from client, admin, or user)
router.post("/", async (req, res) => {
  try {
    const { wedding_id, sender_id, sender_name, sender_role, message, trigger_bot_reply } = req.body;

    if (!wedding_id || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "wedding_id and message are required",
      });
    }

    const role = sender_role || "client";

    // 1. Create and save user/admin message in memory & Supabase (background)
    const savedMsg = await MessageModel.create({
      wedding_id,
      sender_id,
      sender_name,
      sender_role: role,
      message: message.trim(),
    });

    // Broadcast new message over Socket.IO to wedding room immediately
    const io = req.app.get("io");
    if (io) {
      io.to(`wedding_${wedding_id}`).emit("new_message", savedMsg);
    }

    let savedBotMsg = null;

    // 2. If message is from client/user or trigger_bot_reply requested, generate Concierge Bot reply
    if (role !== "admin" || trigger_bot_reply) {
      try {
        let wedding = (store && Array.isArray(store.weddings))
          ? store.weddings.find((w) => w.id === wedding_id)
          : null;
        let guests = (store && Array.isArray(store.guests))
          ? store.guests.filter((g) => g.wedding_id === wedding_id)
          : [];

        if (!wedding) {
          wedding = await Promise.race([
            WeddingModel.getById(wedding_id),
            new Promise((r) => setTimeout(() => r(null), 400)),
          ]).catch(() => null);
        }

        const botReplyText = ConciergeBotService.generateReply({
          wedding,
          guests: guests || [],
          message: message.trim(),
          senderName: sender_name,
        });

        // Save bot reply directly in the database
        savedBotMsg = await MessageModel.create({
          wedding_id,
          sender_id: "emitly_bot",
          sender_name: "Emitly Bot Concierge",
          sender_role: "bot",
          message: botReplyText,
        });

        // Broadcast bot reply over Socket.IO to wedding room
        if (io) {
          io.to(`wedding_${wedding_id}`).emit("new_message", savedBotMsg);
        }
      } catch (botErr) {
        console.warn("Notice: Error generating concierge bot reply:", botErr.message);
      }
    }

    res.status(201).json({
      success: true,
      data: savedMsg,
      bot_reply: savedBotMsg,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
});

// 3. Delete all messages for a specific wedding
router.delete("/:weddingId", async (req, res) => {
  try {
    const { weddingId } = req.params;
    await MessageModel.deleteByWeddingId(weddingId);
    res.json({
      success: true,
      message: `All messages for wedding ${weddingId} deleted from database`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Mark messages as read
router.put("/read/:weddingId", async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { readerRole = "client" } = req.body;
    await MessageModel.markAsRead(weddingId, readerRole);

    const io = req.app.get("io");
    if (io) {
      io.to(`wedding_${weddingId}`).emit("messages_read", { wedding_id: weddingId, reader_role: readerRole });
    }

    res.json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
