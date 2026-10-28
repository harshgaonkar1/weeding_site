import pool from "../Db_connection/dbconnection.js";
import { supabase } from "../Db_connection/supabaseClient.js";
import { store, saveMessagesToFile } from "../Db_connection/queries.js";
import crypto from "crypto";

export const MessageModel = {
  // 1. Get all messages for a specific wedding
  async getByWeddingId(weddingId) {
    if (!weddingId) return [];

    // If the wedding card does not exist, all its messages are deleted
    if (store && Array.isArray(store.weddings) && store.weddings.length > 0) {
      const exists = store.weddings.some((w) => w.id === weddingId);
      if (!exists) {
        if (store.messages && store.messages.some((m) => m.wedding_id === weddingId)) {
          store.messages = store.messages.filter((m) => m.wedding_id !== weddingId);
          saveMessagesToFile();
        }
        return [];
      }
    }

    let supabaseData = null;
    if (supabase) {
      try {
        const { data, error } = await Promise.race([
          supabase
            .from("wedding_messages")
            .select("*")
            .eq("wedding_id", weddingId)
            .order("created_at", { ascending: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500)),
        ]).catch(() => ({ data: null }));
        if (!error && Array.isArray(data) && data.length > 0) {
          supabaseData = data;
          // Synchronize with local disk store so messages are permanently retained
          if (store && Array.isArray(store.messages)) {
            let changed = false;
            supabaseData.forEach((msg) => {
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
        // Fall through to pool / store
      }
    }

    if (supabaseData && supabaseData.length > 0) {
      const seen = new Set();
      return supabaseData.filter((m) => {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          return true;
        }
        return false;
      });
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
      wedding_id,
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

    // 2. Persist into Supabase database table with safety timeout
    if (supabase) {
      try {
        const { error: supaErr } = await Promise.race([
          supabase.from("wedding_messages").insert(newMsg),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase timeout")), 4000)),
        ]);
        if (supaErr) {
          console.warn("Supabase wedding_messages insert note:", supaErr.message);
        } else {
          console.log(`✅ Message ${newMsg.id} saved to Supabase wedding_messages`);
        }
      } catch (e) {
        console.warn("Notice: Supabase wedding_messages insert note:", e.message);
      }
    }

    // 3. Persist through query engine
    try {
      await pool.query(
        `INSERT INTO wedding_messages (id, wedding_id, sender_id, sender_name, sender_role, message, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, wedding_id, newMsg.sender_id, newMsg.sender_name, newMsg.sender_role, newMsg.message, false, created_at]
      );
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

  // 5. Get unread count for a user role
  async getUnreadCount(weddingId, forRole) {
    const msgs = (store.messages || []).filter(
      (m) => (!weddingId || m.wedding_id === weddingId) && m.sender_role !== forRole && !m.is_read
    );
    return msgs.length;
  },
};

