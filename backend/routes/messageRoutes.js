import express from "express";
import { MessageModel } from "../models/messageModel.js";
import { WeddingModel } from "../models/weddingModel.js";
import { GuestModel } from "../models/guestModel.js";
import { ConciergeBotService } from "../services/conciergeBotService.js";

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
// If from a client/user, automatically generate and save the Concierge Bot reply into the DB!
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

    // 1. Create and save user/admin message in DB
    const savedMsg = await MessageModel.create({
      wedding_id,
      sender_id,
      sender_name,
      sender_role: role,
      message: message.trim(),
    });

    let savedBotMsg = null;

    // 2. If message is from client/user or trigger_bot_reply requested, generate Concierge Bot reply
    if (role !== "admin" || trigger_bot_reply) {
      try {
        const [wedding, guests] = await Promise.all([
          WeddingModel.getById(wedding_id).catch(() => null),
          GuestModel.getByWeddingId(wedding_id).catch(() => []),
        ]);

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
    res.json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

