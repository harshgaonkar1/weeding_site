import express from "express";
import { MessageModel } from "../models/messageModel.js";
import { WeddingModel } from "../models/weddingModel.js";
import { GuestModel } from "../models/guestModel.js";
import { ConciergeBotService } from "../services/conciergeBotService.js";
import { store } from "../Db_connection/queries.js";
import { supabase } from "../Db_connection/supabaseClient.js";

const router = express.Router();

// 0. Diagnostic status route to verify database connection and table readiness
router.get("/debug/status", async (req, res) => {
  let supaStatus = "not initialized";
  let supaError = null;
  let sampleCount = 0;

  if (supabase) {
    try {
      const { data, error } = await supabase.from("wedding_messages").select("id, wedding_id, message, created_at").limit(5);
      if (error) {
        supaStatus = "error";
        supaError = error.message;
      } else {
        supaStatus = "connected";
        sampleCount = data ? data.length : 0;
      }
    } catch (e) {
      supaStatus = "exception";
      supaError = e.message;
    }
  }

  res.json({
    success: true,
    supabase_configured: Boolean(supabase),
    supabase_status: supaStatus,
    supabase_error: supaError,
    supabase_messages_found: sampleCount,
    in_memory_messages_count: (store.messages || []).length,
  });
});

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

    const safeWeddingId = wedding_id || "wedding_01";
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "message is required",
      });
    }

    const role = sender_role || "client";

    // 1. Create and save user/admin message in memory & Supabase DB
    const savedMsg = await MessageModel.create({
      wedding_id: safeWeddingId,
      sender_id,
      sender_name,
      sender_role: role,
      message: message.trim(),
    });

    // Broadcast new message over Socket.IO to wedding room immediately
    const io = req.app.get("io");
    if (io) {
      io.to(`wedding_${safeWeddingId}`).emit("new_message", savedMsg);
    }

    let savedBotMsg = null;

    // 2. If message is from client/user or trigger_bot_reply requested, generate Concierge Bot reply
    if (role !== "admin" || trigger_bot_reply) {
      try {
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

        // Save bot reply directly in the database
        savedBotMsg = await MessageModel.create({
          wedding_id: safeWeddingId,
          sender_id: "emitly_bot",
          sender_name: "Emitly Bot Concierge",
          sender_role: "bot",
          message: botReplyText,
        });

        // Broadcast bot reply over Socket.IO to wedding room
        if (io) {
          io.to(`wedding_${safeWeddingId}`).emit("new_message", savedBotMsg);
        }
      } catch (botErr) {
        console.warn("Notice: Error generating concierge bot reply:", botErr.message);
      }
    }

    res.status(201).json({
      success: true,
      data: savedMsg,
      supabase_saved: savedMsg._supabase_status?.success ?? false,
      supabase_error: savedMsg._supabase_status?.error ?? null,
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

// 4. Mark messages as read (Instant 0ms non-blocking response to eliminate 502 / CORS timeouts)
router.put("/read/:weddingId", async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { readerRole = "client" } = req.body;
    const safeWeddingId = weddingId || "wedding_01";

    // Immediate 200 OK response - never blocks the client or triggers proxy timeouts
    res.json({ success: true, message: "Messages marked as read" });

    // Background asynchronous execution
    MessageModel.markAsRead(safeWeddingId, readerRole).catch((err) => {
      console.warn("markAsRead background notice:", err.message);
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`wedding_${safeWeddingId}`).emit("messages_read", {
        wedding_id: safeWeddingId,
        reader_role: readerRole,
      });
    }
  } catch (error) {
    if (!res.headersSent) {
      res.json({ success: true });
    }
  }
});

export default router;
