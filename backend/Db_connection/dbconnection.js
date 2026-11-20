// ============================================================
// PostgreSQL Database Connection Module (DigitalOcean VM / Self-Hosted)
// ------------------------------------------------------------
// Connects to PostgreSQL directly using pg (node-postgres)
// Supports DATABASE_URL or individual POSTGRES_* environment variables.
// ============================================================

import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { query as memoryQuery, store } from "./queries.js";

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

// Helper to detect placeholder hosts that have not been replaced yet
const isPlaceholderHost = (h) =>
  !h ||
  h.includes("YOUR_DATABASE_HOST") ||
  h.includes("<host>") ||
  h.includes("YOUR_HOST") ||
  h.includes("example.com");

/**
 * Resolves PostgreSQL configuration from DATABASE_URL or POSTGRES_* env vars
 */
function resolvePgConfig() {
  let connectionString = process.env.DATABASE_URL || "";
  const explicitHost = process.env.POSTGRES_HOST || process.env.DB_HOST || "";
  const user = process.env.POSTGRES_USER || process.env.DB_USER || "postgres";
  const password = process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || "";
  const port = parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || "5432", 10);
  const database = process.env.POSTGRES_DB || process.env.DB_NAME || "postgres";

  // If DATABASE_URL has a placeholder host but explicitHost is set, substitute it
  if (connectionString && isPlaceholderHost(connectionString) && explicitHost) {
    try {
      const urlObj = new URL(connectionString.replace("postgresql://", "http://").replace("postgres://", "http://"));
      urlObj.hostname = explicitHost;
      connectionString = urlObj.toString().replace("http://", "postgresql://");
    } catch (e) {
      connectionString = `postgresql://${user}:${encodeURIComponent(password)}@${explicitHost}:${port}/${database}`;
    }
  }

  const isRealUrl = Boolean(connectionString && !isPlaceholderHost(connectionString));

  const poolOptions = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 7000,
  };

  if (isRealUrl) {
    poolOptions.connectionString = connectionString;
  } else {
    poolOptions.user = user;
    poolOptions.password = password;
    poolOptions.host = explicitHost || "localhost";
    poolOptions.port = port;
    poolOptions.database = database;
  }

  // DigitalOcean PostgreSQL SSL handling
  const useSsl =
    process.env.PGSSL === "true" ||
    process.env.DB_SSL === "true" ||
    (connectionString && (connectionString.includes("sslmode=require") || connectionString.includes("ssl=true")));

  if (useSsl) {
    poolOptions.ssl = { rejectUnauthorized: false };
  }

  return {
    poolOptions,
    isRealConfigured: isRealUrl || (!isPlaceholderHost(explicitHost) && Boolean(explicitHost)),
    displayHost: isRealUrl
      ? (connectionString.split("@")[1] || "").split("/")[0]
      : `${explicitHost || "localhost"}:${port}`,
    database,
    user,
  };
}

const config = resolvePgConfig();
export const pgPool = new Pool(config.poolOptions);

// Track live PostgreSQL connection state
let isPgConnected = false;
export const getIsPgConnected = () => isPgConnected;

/**
 * Execute query on PostgreSQL, falling back to local memory store if database is not reachable
 */
export const query = async (text, params = []) => {
  if (isPgConnected) {
    try {
      const res = await pgPool.query(text, params);
      return res;
    } catch (err) {
      console.warn(`⚠️ [PostgreSQL Query Error]: ${err.message}. Query: "${text.slice(0, 80)}..."`);
      // If error is a network disconnect, flip state and fallback
      if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT" || err.code === "EHOSTUNREACH") {
        isPgConnected = false;
      }
      return memoryQuery(text, params);
    }
  }

  // Fallback to local memory store
  return memoryQuery(text, params);
};

/**
 * Pool object compatible with pg.Pool interface and models
 */
export const pool = {
  query,
  connect: async () => {
    if (isPgConnected) {
      try {
        return await pgPool.connect();
      } catch (err) {
        isPgConnected = false;
      }
    }
    return {
      query,
      release: () => { },
    };
  },
  end: () => pgPool.end(),
};

/**
 * Auto-initialize database schema from schema.sql on the DigitalOcean PostgreSQL VM
 */
export const initDatabaseSchema = async (client) => {
  try {
    const schemaPath = path.resolve(__dirname, "../schema.sql");
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, "utf8");
      await client.query(schemaSql);
      console.log("✅ [PostgreSQL Schema Verified]: All tables (users, weddings, guests, call_logs, messages) ready on Linux VM.");
    }
  } catch (err) {
    console.warn("⚠️ [PostgreSQL Schema Initialization Notice]:", err.message);
  }
};

/**
 * Test & verify direct connection to PostgreSQL
 */
export const testConnection = async () => {
  console.log(`⚡ Testing PostgreSQL connection to: ${config.displayHost} (Database: ${config.database})`);

  if (!config.isRealConfigured) {
    console.warn("⚠️ [Notice]: 'YOUR_DATABASE_HOST' detected in DATABASE_URL.");
    console.warn("👉 Please set your DigitalOcean Linux VM IP in .env (DATABASE_URL or POSTGRES_HOST).");
    console.log("ℹ️ Server running in safe local fallback mode until VM IP is updated.");
    isPgConnected = false;
    return false;
  }

  try {
    const client = await pgPool.connect();
    try {
      const res = await client.query("SELECT NOW() AS now, current_database() AS db, current_user AS \"user\"");
      const info = res.rows[0];
      isPgConnected = true;
      console.log(`✅ [DigitalOcean PostgreSQL Connected]: Target "${info.db}" as "${info.user}" at ${info.now}`);

      // Auto-create/verify tables from schema.sql on the DigitalOcean VM
      await initDatabaseSchema(client);
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    isPgConnected = false;
    console.error(`❌ [PostgreSQL Connection Failed to ${config.displayHost}]:`, err.message);
    if (err.message.includes("password authentication failed")) {
      console.error("👉 Check POSTGRES_USER and POSTGRES_PASSWORD in your .env file.");
    } else if (err.code === "ECONNREFUSED" || err.message.includes("timeout")) {
      console.error("👉 Ensure PostgreSQL on your DigitalOcean Linux VM has 'listen_addresses = \"*\"' in postgresql.conf and allows remote connections in pg_hba.conf, and port 5432 is open in ufw firewall.");
    }
    console.log("ℹ️ Server operating in safe local memory store fallback mode.");
    return false;
  }
};

// Supabase has been replaced with PostgreSQL on DigitalOcean Linux VM
export const supabase = null;
export const supabaseUrl = null;
export const supabaseKey = null;

export { store };
export default pool;
