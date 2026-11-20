import pool from "../Db_connection/dbconnection.js";
import { store, saveMessagesToFile } from "../Db_connection/queries.js";
import crypto from "crypto";

export const MessageModel = {
  // 1. Get all messages for a specific wedding
  async getByWeddingId(weddingId) {
    const targetWeddingId = weddingId || "wedding_01";
    const idVariants = [targetWeddingId];
    if (targetWeddingId.startsWith("wedding_")) {
      idVariants.push(targetWeddingId.replace(/^wedding_/, ""));
    } else {
      idVariants.push(`wedding_${targetWeddingId}`);
    }

    const localMsgs = (store.messages || []).filter((m) => idVariants.includes(m.wedding_id));

    // Fetch from PostgreSQL database on Linux VM
    try {
      const { rows } = await pool.query(
        "SELECT * FROM wedding_messages WHERE wedding_id = ANY($1) ORDER BY created_at ASC",
        [idVariants]
      );

      if (rows && Array.isArray(rows) && rows.length > 0) {
        // Merge with any in-memory messages not yet in database
        const seen = new Set(rows.map((m) => m.id));
        localMsgs.forEach((lm) => {
          if (!seen.has(lm.id)) {
            rows.push(lm);
            seen.add(lm.id);
          }
        });
        rows.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        // Sync into local in-memory store so it stays fresh
        if (!store.messages) store.messages = [];
        const currentStoreIds = new Set(store.messages.map((m) => m.id));
        rows.forEach((m) => {
          if (!currentStoreIds.has(m.id)) {
            store.messages.push(m);
          }
        });
        saveMessagesToFile();

        return rows;
      }
    } catch (err) {
      console.warn("Notice: PostgreSQL fetch fallback to local store:", err.message);
    }

    // Local fallback
    localMsgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return localMsgs;
  },

  // Helper: Asynchronous PostgreSQL persistence on Linux VM
  async persistToDatabase(newMsg) {
    try {
      await pool.query(
        `INSERT INTO wedding_messages (id, wedding_id, sender_id, sender_name, sender_role, message, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [newMsg.id, newMsg.wedding_id, newMsg.sender_id, newMsg.sender_name, newMsg.sender_role, newMsg.message, false]
      );
      console.log(`✅ [PostgreSQL DB] Message saved: ${newMsg.id}`);
    } catch (err) {
      // If foreign key constraint triggered, auto-create parent wedding row and retry
      if (err.code === "23503" || err.message?.includes("foreign key")) {
        try {
          await pool.query(
            "INSERT INTO weddings (id, groom_name, bride_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
            [newMsg.wedding_id, "Groom", "Bride"]
          );
          await pool.query(
            `INSERT INTO wedding_messages (id, wedding_id, sender_id, sender_name, sender_role, message, is_read, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [newMsg.id, newMsg.wedding_id, newMsg.sender_id, newMsg.sender_name, newMsg.sender_role, newMsg.message, false]
          );
          console.log(`✅ [PostgreSQL DB] Message saved after auto-creating wedding: ${newMsg.id}`);
        } catch (retryErr) {
          console.warn("PostgreSQL retry save note:", retryErr.message);
        }
      } else {
        console.warn("PostgreSQL message save note:", err.message);
      }
    }
  },

  // 2. Create and permanently save a new message in PostgreSQL
  async create({ wedding_id, sender_id, sender_name, sender_role, message }) {
    const safeWeddingId = wedding_id || "wedding_01";
    const id = `msg_${crypto.randomUUID()}`;
    const created_at = new Date().toISOString();
    const role = sender_role || "client";

    const newMsg = {
      id,
      wedding_id: safeWeddingId,
      sender_id: sender_id || (role === "admin" ? "admin" : "client"),
      sender_name: sender_name || (role === "admin" ? "Admin" : "Client"),
      sender_role: role,
      message: (message || "").trim(),
      is_read: false,
      created_at,
    };

    // 1. Save in local in-memory store immediately (0ms instant)
    if (!store.messages) store.messages = [];
    store.messages.push(newMsg);
    saveMessagesToFile();

    // 2. Persist to PostgreSQL in background
    this.persistToDatabase(newMsg).catch((err) => {
      console.warn("Background persist note:", err.message);
    });

    return newMsg;
  },

  // 3. Delete messages for a wedding
  async deleteByWeddingId(weddingId) {
    if (!weddingId) return true;
    if (store && store.messages) {
      store.messages = store.messages.filter((m) => m.wedding_id !== weddingId);
      saveMessagesToFile();
    }
    try {
      await pool.query("DELETE FROM wedding_messages WHERE wedding_id = $1", [weddingId]);
    } catch (e) {
      console.warn("PostgreSQL delete messages note:", e.message);
    }
    return true;
  },

  // 4. Mark messages as read for a wedding
  async markAsRead(weddingId, readerRole) {
    const targetWeddingId = weddingId || "wedding_01";
    if (store && store.messages) {
      store.messages.forEach((m) => {
        if (m.wedding_id === targetWeddingId && m.sender_role !== readerRole) {
          m.is_read = true;
        }
      });
      saveMessagesToFile();
    }
    try {
      await pool.query(
        "UPDATE wedding_messages SET is_read = true WHERE wedding_id = $1 AND sender_role != $2",
        [targetWeddingId, readerRole]
      );
    } catch (e) {
      console.warn("PostgreSQL markAsRead note:", e.message);
    }
    return true;
  },
};

export default MessageModel;
