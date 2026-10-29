import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Candidate paths for .env file
const envCandidates = [
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(process.cwd(), "backend/.env"),
  path.resolve(process.cwd(), ".env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://xzhhxgvtmevjzsowzyvg.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "sb_secret_r5q8zQ_U_MZSXpNl9JSeKA_leatzfk-";

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log("✅ Supabase JS client initialized successfully");
  } catch (err) {
    console.warn("⚠️ Supabase JS client initialization notice:", err.message);
    supabase = null;
  }
} else {
  console.log("ℹ️ Supabase JS client not initialized (SUPABASE_URL or Key missing in .env)");
}

export { supabase, supabaseUrl, supabaseKey };
export default supabase;
