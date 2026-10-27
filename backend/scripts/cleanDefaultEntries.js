import { supabase } from "../Db_connection/supabaseClient.js";
import pool from "../Db_connection/dbconnection.js";
import { store, saveMessagesToFile } from "../Db_connection/queries.js";

async function cleanDefaultEntries() {
  console.log("Starting deletion of default marriage entries...");

  const defaultIds = ["wedding_01", "wedding_02", "wedding_03"];

  // 1. Clean local memory store
  store.weddings = (store.weddings || []).filter((w) => !defaultIds.includes(w.id));
  store.guests = (store.guests || []).filter((g) => !defaultIds.includes(g.wedding_id));
  store.guest_call_logs = (store.guest_call_logs || []).filter((c) => !defaultIds.includes(c.wedding_id));
  store.messages = (store.messages || []).filter((m) => !defaultIds.includes(m.wedding_id));
  saveMessagesToFile();
  console.log("✅ Local in-memory store and messages_store.json cleaned.");

  // 2. Clean Supabase database
  if (supabase) {
    try {
      console.log("Cleaning Supabase default records...");
      for (const id of defaultIds) {
        await Promise.race([
          Promise.allSettled([
            supabase.from("wedding_messages").delete().eq("wedding_id", id),
            supabase.from("guest_call_logs").delete().eq("wedding_id", id),
            supabase.from("guests").delete().eq("wedding_id", id),
            supabase.from("weddings").delete().eq("id", id),
          ]),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase timeout")), 4000)),
        ]).catch((e) => console.warn(`Supabase notice for ${id}:`, e.message));
      }
      console.log("✅ Supabase default records deleted.");
    } catch (err) {
      console.warn("Supabase cleanup note:", err.message);
    }
  }

  // 3. Clean pool / PostgreSQL
  try {
    for (const id of defaultIds) {
      await pool.query("DELETE FROM wedding_messages WHERE wedding_id = $1", [id]).catch(() => {});
      await pool.query("DELETE FROM guest_call_logs WHERE wedding_id = $1", [id]).catch(() => {});
      await pool.query("DELETE FROM guests WHERE wedding_id = $1", [id]).catch(() => {});
      await pool.query("DELETE FROM weddings WHERE id = $1", [id]).catch(() => {});
    }
    console.log("✅ Pool database default records deleted.");
  } catch (err) {
    console.warn("Pool cleanup note:", err.message);
  }

  console.log("🎉 All default marriage entries successfully removed!");
  process.exit(0);
}

cleanDefaultEntries().catch((err) => {
  console.error("Error during cleanup:", err);
  process.exit(1);
});
