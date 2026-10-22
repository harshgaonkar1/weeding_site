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

    // Create user/admin message
    const savedMsg = await MessageModel.create({
      wedding_id,
      sender_id,
      sender_name,
      sender_role: sender_role || "client",
      message: message.trim(),
    });

    let botReply = null;
    // If sent by client and bot reply requested or admin offline
    if (sender_role === "client" && trigger_bot_reply) {
      const botResponses = [
        "Hi! Super Admin Manish has received your message. Our team is actively reviewing your request and will follow up shortly.",
        "Message received! For urgent guest pickups or flight changes, our Call Center telecallers are also updated in real time.",
        "Thank you for reaching out! We've noted your request and Admin Manish will reply soon.",
      ];
      const randomReply = botResponses[Math.floor(Math.random() * botResponses.length)];

      botReply = await MessageModel.create({
        wedding_id,
        sender_id: "bot_concierge",
        sender_name: "Emitly Wedding Bot 🤖",
        sender_role: "bot",
        message: randomReply,
      });
    }

    res.status(201).json({
      success: true,
      data: savedMsg,
      botReply,
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
