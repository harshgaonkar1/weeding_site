import { supabase } from "../Db_connection/supabaseClient.js";
import { store, saveMessagesToFile } from "../Db_connection/queries.js";
import crypto from "crypto";

export const MessageModel = {
  // 1. Get all messages for a specific wedding
  async getByWeddingId(weddingId) {
    const targetWeddingId = weddingId || "wedding_01";

    // Fetch from Supabase database
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("wedding_messages")
          .select("*")
          .eq("wedding_id", targetWeddingId)
          .order("created_at", { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn("Notice: Live DB fetch fallback:", err.message);
      }
    }

    // Local fallback
    return (store.messages || []).filter((m) => m.wedding_id === targetWeddingId);
  },

  // 2. Create and permanently save a new message in Supabase
  async create({ wedding_id, sender_id, sender_name, sender_role, message }) {
    const safeWeddingId = wedding_id || "wedding_01";
    const id = `msg_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
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

    // 1. Save in local in-memory store
    if (!store.messages) store.messages = [];
    store.messages.push(newMsg);
    saveMessagesToFile();

    // 2. Save directly into Supabase database
    if (supabase) {
      try {
        const { error } = await supabase.from("wedding_messages").insert([newMsg]);
        if (error) {
          console.warn("Supabase insert note:", error.message);
          // If foreign key constraint triggered, auto-create parent wedding row and retry
          if (error.code === "23503" || error.message?.includes("foreign key")) {
            await supabase.from("weddings").upsert({
              id: safeWeddingId,
              groom_name: "Groom",
              bride_name: "Bride",
            });
            await supabase.from("wedding_messages").insert([newMsg]);
          }
        } else {
          console.log(`✅ [DB SUCCESS] Message saved to Supabase: ${newMsg.id}`);
        }
      } catch (err) {
        console.warn("Supabase save note:", err.message);
      }
    }

    return newMsg;
  },

  // 3. Delete messages for a wedding
  async deleteByWeddingId(weddingId) {
    if (!weddingId) return true;
    if (store && store.messages) {
      store.messages = store.messages.filter((m) => m.wedding_id !== weddingId);
      saveMessagesToFile();
    }
    if (supabase) {
      try {
        await supabase.from("wedding_messages").delete().eq("wedding_id", weddingId);
      } catch (e) {}
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

  // 5. Unread count for a role
  async getUnreadCount(weddingId, forRole) {
    const targetWeddingId = weddingId || "wedding_01";
    return (store.messages || []).filter(
      (m) => (!targetWeddingId || m.wedding_id === targetWeddingId) && m.sender_role !== forRole && !m.is_read
    ).length;
  },
};

export default MessageModel;
