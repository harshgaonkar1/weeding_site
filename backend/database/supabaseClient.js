// ============================================================
// Supabase JS Client Instance
// ------------------------------------------------------------
// Initializes official @supabase/supabase-js client using
// SUPABASE_URL and SUPABASE_SECRET_KEY / SUPABASE_PUBLISHABLE_KEY / SUPABASE_ANON_KEY.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  "";

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log("✅ Supabase JS client initialized");
  } catch (err) {
    console.warn("⚠️ Supabase JS client initialization notice:", err.message);
    supabase = null;
  }
} else {
  console.log("ℹ️ Supabase JS client not initialized (SUPABASE_URL or Key missing in .env)");
}

export { supabase, supabaseUrl, supabaseKey };
export default supabase;
