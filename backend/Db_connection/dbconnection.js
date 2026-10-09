// ============================================================
// Supabase Database Connection Module
// ------------------------------------------------------------
// Initializes and manages the Supabase connection using only official
// Supabase API credentials.
// ============================================================

import dotenv from "dotenv";
import { supabase, supabaseUrl, supabaseKey } from "./supabaseClient.js";
import { query, pool, store } from "./queries.js";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || supabaseUrl || "";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  "";
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";
const SUPABASE_JWKS_URL =
  process.env.SUPABASE_JWKS_URL ||
  (SUPABASE_URL ? `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` : "");

// ============================================================
// Test & Verify Connection
// ============================================================
export const testConnection = async () => {
  console.log(`⚡ Supabase API Target: ${SUPABASE_URL || "Local / In-Memory"}`);
  if (supabase) {
    console.log("✅ Official Supabase JS Client initialized and ready.");
  } else {
    console.log("ℹ️ Running in memory mode with Supabase schema.");
  }
};

// Export Connection & Query Engine Interface
export {
  supabase,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY,
  SUPABASE_JWKS_URL,
  query,
  pool,
  store,
};

export default pool;
