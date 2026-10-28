import pool from "../Db_connection/dbconnection.js";
import { supabase } from "../Db_connection/supabaseClient.js";
import { store, saveMessagesToFile } from "../Db_connection/queries.js";
import crypto from "crypto";

export const MessageModel = {
  // 1. Get all messages for a specific wedding from Database & Store
  async getByWeddingId(weddingId) {
    const targetWeddingId = weddingId || "wedding_01";
    let dbMessages = null;

    // 1. Query live Supabase database
    if (supabase) {
      try {
        let { data, error } = await Promise.race([
          supabase
            .from("wedding_messages")
            .select("*")
            .eq("wedding_id", targetWeddingId)
            .order("created_at", { ascending: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000)),
        ]).catch(() => ({ data: null, error: null }));

        // Fallback to 'messages' table if wedding_messages does not exist
        if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
          const altRes = await supabase
            .from("messages")
            .select("*")
            .eq("wedding_id", targetWeddingId)
            .order("created_at", { ascending: true })
            .catch(() => ({ data: null }));
          data = altRes.data;
        }

        if (Array.isArray(data) && data.length > 0) {
          dbMessages = data;
          // Synchronize in-memory and local disk store with live DB data
          if (store && Array.isArray(store.messages)) {
            let changed = false;
            dbMessages.forEach((msg) => {
              const idx = store.messages.findIndex((m) => m.id === msg.id);
              if (idx === -1) {
                store.messages.push(msg);
                changed = true;
              } else {
                store.messages[idx] = { ...store.messages[idx], ...msg };
              }
            });
            if (changed) saveMessagesToFile();
          }
        }
      } catch (e) {
        console.warn("Supabase fetch messages notice:", e.message);
      }
    }

    if (dbMessages && dbMessages.length > 0) {
      const seen = new Set();
      return dbMessages.filter((m) => {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          return true;
        }
        return false;
      });
    }

    // 2. Query pool engine fallback
    try {
      const { rows } = await pool.query(
        "SELECT * FROM wedding_messages WHERE wedding_id = $1 ORDER BY created_at ASC",
        [targetWeddingId]
      );
      if (rows && rows.length > 0) {
        const seen = new Set();
        return rows.filter((m) => {
          if (!seen.has(m.id)) {
            seen.add(m.id);
            return true;
          }
          return false;
        });
      }
    } catch (e) {}

    // 3. In-memory / persistent file store fallback
    const seen = new Set();
    return (store.messages || [])
      .filter((m) => m.wedding_id === targetWeddingId)
      .filter((m) => {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          return true;
        }
        return false;
      });
  },

  // 2. Create and permanently save a new message in Supabase & Store
  async create({
    wedding_id,
    sender_id,
    sender_name,
    sender_role, // 'admin', 'client', or 'bot'
    message,
  }) {
    const safeWeddingId = wedding_id || "wedding_01";
    const id = `msg_${crypto.randomUUID().slice(0, 10)}`;
    const created_at = new Date().toISOString();

    const role = sender_role || "client";
    const defaultSenderId =
      role === "admin"
        ? "user_admin_01"
        : role === "bot"
        ? "emitly_bot"
        : "client_user";

    const defaultSenderName =
      role === "admin"
        ? "Manish (Admin)"
        : role === "bot"
        ? "Emitly Bot Concierge"
        : "Wedding Client";

    const newMsg = {
      id,
      wedding_id: safeWeddingId,
      sender_id: sender_id || defaultSenderId,
      sender_name: sender_name || defaultSenderName,
      sender_role: role,
      message: message.trim(),
      is_read: false,
      created_at,
    };

    // 1. Immediately store in memory and persist to local messages_store.json on disk
    if (!store.messages) store.messages = [];
    const exists = store.messages.some((m) => m.id === newMsg.id);
    if (!exists) {
      store.messages.push(newMsg);
      saveMessagesToFile();
    }

    // 2. Persist directly into Supabase database
    if (supabase) {
      try {
        let { error: supaErr } = await Promise.race([
          supabase.from("wedding_messages").upsert(newMsg),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase insert timeout")), 3000)),
        ]).catch((err) => ({ error: err }));

        // Handle foreign key constraint: if parent wedding row doesn't exist yet in weddings table
        if (supaErr && (supaErr.code === "23503" || supaErr.message?.includes("foreign key"))) {
          console.warn(`⚠️ Foreign key notice: auto-creating parent wedding ${safeWeddingId} in Supabase`);
          await supabase.from("weddings").upsert({
            id: safeWeddingId,
            groom_name: "Groom",
            bride_name: "Bride",
          }).catch(() => {});

          // Retry insert
          const retry = await supabase.from("wedding_messages").upsert(newMsg);
          supaErr = retry.error;
        }

        // Handle table name fallback: if table is named 'messages' instead
        if (supaErr && (supaErr.code === "42P01" || supaErr.message?.includes("does not exist"))) {
          console.warn("Table wedding_messages not found, falling back to 'messages' table");
          const altRes = await supabase.from("messages").upsert(newMsg).catch(() => ({}));
          supaErr = altRes?.error || null;
        }

        if (supaErr) {
          console.error("❌ Supabase message insert error:", supaErr.message);
          newMsg._supabase_status = { success: false, error: supaErr.message };
        } else {
          console.log(`✅ Message ${newMsg.id} successfully saved to Supabase DB for wedding ${safeWeddingId}`);
          newMsg._supabase_status = { success: true, error: null };
        }
      } catch (e) {
        console.error("❌ Supabase message save exception:", e.message);
        newMsg._supabase_status = { success: false, error: e.message };
      }
    } else {
      newMsg._supabase_status = { success: false, error: "Supabase client not initialized" };
    }

    // 3. Persist through PostgreSQL/MySQL query engine
    try {
      pool.query(
        `INSERT INTO wedding_messages (id, wedding_id, sender_id, sender_name, sender_role, message, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, safeWeddingId, newMsg.sender_id, newMsg.sender_name, newMsg.sender_role, newMsg.message, false, created_at]
      ).catch(() => {});
    } catch (e) {}

    return newMsg;
  },

  // 3. Delete all messages for a specific wedding when the wedding is deleted
  async deleteByWeddingId(weddingId) {
    if (!weddingId) return false;

    // Immediately remove from in-memory store and persist to disk
    if (store && Array.isArray(store.messages)) {
      store.messages = store.messages.filter((m) => m.wedding_id !== weddingId);
      saveMessagesToFile();
    }

    if (supabase) {
      try {
        await Promise.race([
          supabase.from("wedding_messages").delete().eq("wedding_id", weddingId),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase delete timeout")), 2000)),
        ]).catch(() => {});
      } catch (e) {
        console.warn("Supabase wedding_messages delete notice:", e.message);
      }
    }

    try {
      await pool.query("DELETE FROM wedding_messages WHERE wedding_id = $1", [weddingId]).catch(() => {});
    } catch (e) {}

    return true;
  },

  // 4. Mark messages as read for a wedding
  async markAsRead(weddingId, readerRole) {
    const targetWeddingId = weddingId || "wedding_01";
    if (store.messages) {
      store.messages.forEach((m) => {
        if (m.wedding_id === targetWeddingId && m.sender_role !== readerRole) {
          m.is_read = true;
        }
      });
      saveMessagesToFile();
    }

    if (supabase) {
      try {
        await supabase
          .from("wedding_messages")
          .update({ is_read: true })
          .eq("wedding_id", targetWeddingId)
          .neq("sender_role", readerRole);
      } catch (e) {}
    }

    return true;
  },

  // 5. Get unread count for a user role
  async getUnreadCount(weddingId, forRole) {
    const targetWeddingId = weddingId || "wedding_01";
    const msgs = (store.messages || []).filter(
      (m) => (!targetWeddingId || m.wedding_id === targetWeddingId) && m.sender_role !== forRole && !m.is_read
    );
    return msgs.length;
  },
};

export default MessageModel;
