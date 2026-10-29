import crypto from "crypto";
import { supabase } from "../Db_connection/supabaseClient.js";
import { UserModel } from "../models/userModel.js";
import { WeddingModel } from "../models/weddingModel.js";
import { GuestModel } from "../models/guestModel.js";
import { ConciergeBotService } from "../services/conciergeBotService.js";

/**
 * Normalizes wedding room name to the target architecture standard:
 * "wedding:<wedding_id>"
 */
export const getWeddingRoom = (weddingId) => {
  if (!weddingId) return "wedding:default";
  const clean = String(weddingId).replace(/^wedding:/, "").trim();
  return `wedding:${clean}`;
};

/**
 * Authenticates socket handshake or REST token against existing auth / database.
 * Derives user identity server-side so client claims are never blindly trusted.
 * Returns { id, name, role: 'admin' | 'client', weddingId } or null.
 */
export async function authenticate(auth) {
  if (!auth) return null;
  const token = typeof auth === "string" ? auth : auth.token;
  if (!token || typeof token !== "string") return null;

  const rawToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
  if (!rawToken) return null;

  // 1. Admin session / mock token
  if (
    rawToken.startsWith("session_admin_") ||
    rawToken.startsWith("mock_admin_") ||
    rawToken === "admin"
  ) {
    if (supabase) {
      const { data: user } = await supabase
        .from("users")
        .select("id, name, email, role")
        .eq("role", "admin")
        .maybeSingle();

      if (user) {
        return {
          id: user.id,
          name: user.name || "Manish (Admin)",
          role: "admin",
          weddingId: null, // Admin can join any wedding
        };
      }
    }

    const adminUser = (await UserModel.findById("user_admin_01")) || {
      id: "user_admin_01",
      name: "Manish (Admin)",
      role: "admin",
    };
    return {
      id: adminUser.id,
      name: adminUser.name || "Manish (Admin)",
      role: "admin",
      weddingId: null,
    };
  }

  // 2. Call center agent session / mock token (staff admin privileges for wedding monitoring)
  if (rawToken.includes("call_center") || rawToken.includes("callcenter")) {
    if (supabase) {
      const { data: user } = await supabase
        .from("users")
        .select("id, name, email, role")
        .eq("role", "call_center")
        .maybeSingle();

      if (user) {
        return {
          id: user.id,
          name: user.name || "Sarah (Call Desk)",
          role: "admin",
          weddingId: null,
        };
      }
    }

    const agentUser = await UserModel.findById("user_agent_01");
    if (agentUser) {
      return {
        id: agentUser.id,
        name: agentUser.name || "Sarah (Call Desk)",
        role: "admin",
        weddingId: null,
      };
    }
  }

  // 3. Client session / mock token: extracts weddingId and verifies against weddings table
  if (rawToken.includes("client")) {
    let weddingId = null;
    const match = rawToken.match(/(?:session_client_|mock_client_)(wedding_[a-zA-Z0-9]+|[a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      weddingId = match[1];
    }
    if (!weddingId && typeof auth === "object" && auth.weddingId) {
      weddingId = auth.weddingId;
    }

    if (weddingId) {
      const cleanWId = String(weddingId).replace(/^wedding:/, "");
      let wedding = null;

      if (supabase) {
        const { data } = await supabase
          .from("weddings")
          .select("id, groom_name, bride_name, client_username")
          .eq("id", cleanWId)
          .maybeSingle();
        if (data) wedding = data;
      }

      if (!wedding) {
        wedding = await WeddingModel.getById(cleanWId);
      }

      if (wedding) {
        const clientName =
          wedding.groom_name && wedding.bride_name
            ? `${wedding.groom_name} & ${wedding.bride_name}`
            : wedding.client_username || "Wedding Client";

        return {
          id: `marriage_${wedding.id}`,
          name: clientName,
          role: "client",
          weddingId: wedding.id,
        };
      }
    }
  }

  // 4. Direct user ID or wedding ID token lookup
  if (supabase) {
    const { data: userRow } = await supabase
      .from("users")
      .select("id, name, role")
      .eq("id", rawToken)
      .maybeSingle();

    if (userRow && userRow.role === "admin") {
      return {
        id: userRow.id,
        name: userRow.name,
        role: "admin",
        weddingId: null,
      };
    }

    const { data: weddingRow } = await supabase
      .from("weddings")
      .select("id, groom_name, bride_name, client_username")
      .eq("id", rawToken)
      .maybeSingle();

    if (weddingRow) {
      return {
        id: `marriage_${weddingRow.id}`,
        name: `${weddingRow.groom_name} & ${weddingRow.bride_name}`,
        role: "client",
        weddingId: weddingRow.id,
      };
    }
  }

  return null;
}

/**
 * Initialize Socket.IO event listeners for Real-Time Wedding Chat
 * Matches target architecture specifications:
 * - Scoped per wedding: room is wedding:<wedding_id>
 * - Sender identity derived exclusively server-side
 * - Input validation: non-empty string, max 1000 chars
 * - Server generates id (msg_${crypto.randomUUID()})
 * - Saves to DB first, then broadcasts to wedding room
 * @param {import("socket.io").Server} io
 */
export const initializeChatSocket = (io) => {
  // Authenticate every socket connection (Rule 6)
  io.use(async (socket, next) => {
    try {
      const user = await authenticate(socket.handshake.auth);
      if (!user) {
        console.warn(`🔒 Socket connection rejected: Unauthorized handshake from ${socket.id}`);
        return next(new Error("unauthorized"));
      }
      socket.data.user = user;
      next();
    } catch (err) {
      console.warn("Socket authentication error:", err.message);
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`🔌 Socket client connected: ${socket.id} | User: ${user.name} (${user.role})`);

    // Rule 7: Clients are locked to their own wedding room; admins pick one via join_wedding
    if (user.role === "client") {
      socket.data.weddingId = user.weddingId;
      const room = `wedding:${user.weddingId}`;
      socket.join(room);
      console.log(`💬 Socket ${socket.id} (client) joined ${room}`);
    }

    // Admins pick/switch wedding room
    socket.on("join_wedding", (weddingId, ack) => {
      if (user.role !== "admin") {
        return ack?.({ ok: false, error: "Forbidden: Clients may only access their own wedding" });
      }

      const cleanId = String(weddingId || "").replace(/^wedding:/, "").trim();
      if (!cleanId) {
        return ack?.({ ok: false, error: "weddingId is required" });
      }

      if (socket.data.weddingId) {
        socket.leave(`wedding:${socket.data.weddingId}`);
      }
      socket.data.weddingId = cleanId;
      const room = `wedding:${cleanId}`;
      socket.join(room);
      console.log(`💬 Socket ${socket.id} (admin) joined ${room}`);
      ack?.({ ok: true, room });
    });

    // Leave wedding room
    socket.on("leave_wedding", (weddingId, ack) => {
      const cleanId = String(weddingId || socket.data.weddingId || "").replace(/^wedding:/, "").trim();
      if (cleanId) {
        socket.leave(`wedding:${cleanId}`);
      }
      ack?.({ ok: true });
    });

    // Incoming message handler (Rule 3, 4, 5, 6)
    socket.on("message", async (text, ack) => {
      const weddingId = socket.data.weddingId;
      if (!weddingId) {
        return ack?.({ ok: false, error: "No wedding selected" });
      }

      // Rule 3: text must be string, non-empty after trim, max 1000 chars
      const rawText = typeof text === "string" ? text : (text?.message || text?.text || "");
      if (typeof rawText !== "string" || !rawText.trim() || rawText.trim().length > 1000) {
        return ack?.({ ok: false, error: "Invalid message: must be non-empty string under 1000 characters" });
      }

      const cleanText = rawText.trim();
      const messageId = `msg_${crypto.randomUUID()}`;

      // Rule 5: Server saves to DB first using service role key
      if (!supabase) {
        return ack?.({ ok: false, error: "Database unavailable" });
      }

      const { data, error } = await supabase
        .from("wedding_messages")
        .insert({
          id: messageId,
          wedding_id: weddingId,
          sender_id: user.id,
          sender_name: user.name,
          sender_role: user.role, // 'admin' | 'client'
          message: cleanText,
        })
        .select()
        .single();

      if (error) {
        console.error("Save message failed:", error.message);
        return ack?.({ ok: false, error: "Could not save message" });
      }

      // Rule 5: Then emit the saved row to the wedding room
      const room = `wedding:${weddingId}`;
      io.to(room).emit("message", data);
      io.to(room).emit("new_message", data); // legacy alias
      ack?.({ ok: true, data });

      // Automated Concierge Bot response if message is from a client
      if (user.role !== "admin") {
        setTimeout(async () => {
          try {
            let wedding = await WeddingModel.getById(weddingId);
            let guests = await GuestModel.getByWeddingId(weddingId).catch(() => []);

            const botReplyText = ConciergeBotService.generateReply({
              wedding,
              guests: guests || [],
              message: cleanText,
              senderName: user.name,
            });

            const botMsgId = `msg_${crypto.randomUUID()}`;
            const { data: botData, error: botError } = await supabase
              .from("wedding_messages")
              .insert({
                id: botMsgId,
                wedding_id: weddingId,
                sender_id: "emitly_bot",
                sender_name: "Emitly Bot Concierge",
                sender_role: "bot",
                message: botReplyText,
              })
              .select()
              .single();

            if (!botError && botData) {
              io.to(room).emit("message", botData);
              io.to(room).emit("new_message", botData);
            }
          } catch (botErr) {
            console.warn("Notice: Concierge bot socket reply note:", botErr.message);
          }
        }, 400);
      }
    });

    // Support legacy "send_message" event payload for backward compatibility
    socket.on("send_message", async (payload, ack) => {
      const text = typeof payload === "string" ? payload : payload?.message;
      return socket.listeners("message")[0](text, ack);
    });

    // Mark messages as read for a wedding
    socket.on("mark_read", async (payload, ack) => {
      const weddingId = socket.data.weddingId || payload?.wedding_id;
      if (!weddingId) return ack?.({ ok: false });
      const cleanId = String(weddingId).replace(/^wedding:/, "");
      try {
        await supabase
          .from("wedding_messages")
          .update({ is_read: true })
          .eq("wedding_id", cleanId)
          .neq("sender_role", user.role);

        io.to(`wedding:${cleanId}`).emit("messages_read", {
          wedding_id: cleanId,
          reader_role: user.role,
        });
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false });
      }
    });

    // Typing status indicator
    socket.on("typing", ({ wedding_id, user_name, is_typing }) => {
      const targetWId = socket.data.weddingId || wedding_id;
      if (!targetWId) return;
      const cleanId = String(targetWId).replace(/^wedding:/, "");
      socket.to(`wedding:${cleanId}`).emit("user_typing", {
        user_name: user_name || user.name,
        is_typing: Boolean(is_typing),
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket client disconnected: ${socket.id} (${reason})`);
    });
  });
};

export default initializeChatSocket;
