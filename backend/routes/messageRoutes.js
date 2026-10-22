import express from "express";
import { MessageModel } from "../models/messageModel.js";

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

// 2. Post a new message (from client or admin)
router.post("/", async (req, res) => {
  try {
    const { wedding_id, sender_id, sender_name, sender_role, message, trigger_bot_reply } = req.body;

    if (!wedding_id || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "wedding_id and message are required",
      });
    }

    // Create user/admin message (exactly 1 message)
    const savedMsg = await MessageModel.create({
      wedding_id,
      sender_id,
      sender_name,
      sender_role: sender_role || "client",
      message: message.trim(),
    });

    res.status(201).json({
      success: true,
      data: savedMsg,
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

// 3. Mark messages as read
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
