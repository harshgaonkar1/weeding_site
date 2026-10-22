import pool from "../Db_connection/dbconnection.js";
import { supabase } from "../Db_connection/supabaseClient.js";
import { store } from "../Db_connection/queries.js";
import crypto from "crypto";

export const MessageModel = {
  // 1. Get all messages for a specific wedding
  async getByWeddingId(weddingId) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("wedding_messages")
          .select("*")
          .eq("wedding_id", weddingId)
          .order("created_at", { ascending: true });
        if (data && !error && data.length > 0) {
          const seen = new Set();
          return data.filter((m) => {
            if (!seen.has(m.id)) {
              seen.add(m.id);
              return true;
            }
            return false;
          });
        }
      } catch (e) {
        // Fall through to pool / store
      }
    }

    try {
      const { rows } = await pool.query(
        "SELECT * FROM wedding_messages WHERE wedding_id = $1 ORDER BY created_at ASC",
        [weddingId]
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
    } catch (e) {
      // In-memory fallback
    }

    const seen = new Set();
    return (store.messages || [])
      .filter((m) => m.wedding_id === weddingId)
      .filter((m) => {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          return true;
        }
        return false;
      });
  },

  // 2. Create a new message
  async create({
    wedding_id,
    sender_id,
    sender_name,
    sender_role, // 'admin', 'client', or 'bot'
    message,
  }) {
    const id = `msg_${crypto.randomUUID().slice(0, 10)}`;
    const created_at = new Date().toISOString();

    const newMsg = {
      id,
      wedding_id,
      sender_id: sender_id || (sender_role === "admin" ? "user_admin_01" : "client_user"),
      sender_name: sender_name || (sender_role === "admin" ? "Manish (Admin)" : "Wedding Client"),
      sender_role: sender_role || "client",
      message: message.trim(),
      is_read: false,
      created_at,
    };

    // Try Supabase
    if (supabase) {
      try {
        await supabase.from("wedding_messages").insert([newMsg]);
      } catch (e) {
        console.warn("Notice: Supabase wedding_messages insert failed, retained in store:", e.message);
      }
    }

    // Insert through query engine (which handles store.messages safely without duplicates)
    try {
      await pool.query(
        `INSERT INTO wedding_messages (id, wedding_id, sender_id, sender_name, sender_role, message, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, wedding_id, newMsg.sender_id, newMsg.sender_name, newMsg.sender_role, newMsg.message, false, created_at]
      );
    } catch (e) {
      if (!store.messages) store.messages = [];
      const exists = store.messages.some((m) => m.id === newMsg.id);
      if (!exists) store.messages.push(newMsg);
    }

    return newMsg;
  },

  // 3. Mark messages as read for a wedding
  async markAsRead(weddingId, readerRole) {
    if (store.messages) {
      store.messages.forEach((m) => {
        if (m.wedding_id === weddingId && m.sender_role !== readerRole) {
          m.is_read = true;
        }
      });
    }

    if (supabase) {
      try {
        await supabase
          .from("wedding_messages")
          .update({ is_read: true })
          .eq("wedding_id", weddingId)
          .neq("sender_role", readerRole);
      } catch (e) {}
    }

    return true;
  },

  // 4. Get unread count for a user role
  async getUnreadCount(weddingId, forRole) {
    const msgs = (store.messages || []).filter(
      (m) => (!weddingId || m.wedding_id === weddingId) && m.sender_role !== forRole && !m.is_read
    );
    return msgs.length;
  },
};
