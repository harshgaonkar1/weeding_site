import pool from "../Db_connection/dbconnection.js";
import { supabase } from "../Db_connection/supabaseClient.js";
import crypto from "crypto";

export const UserModel = {
  // Find user by email, username, or name from Supabase DB or in-memory pool
  async findByIdentifier(identifier) {
    const clean = (identifier || "").trim().toLowerCase();
    if (!clean) return null;

    // 1. Check live Supabase DB
    if (supabase) {
      try {
        const { data, error } = await supabase.from("users").select("*");
        if (data && data.length > 0) {
          const user = data.find((u) => {
            const uId = (u.id || "").toLowerCase();
            const uEmail = (u.email || "").toLowerCase();
            const uName = (u.name || "").toLowerCase();
            const uRole = (u.role || "").toLowerCase();

            return (
              uId === clean ||
              uEmail === clean ||
              uEmail.startsWith(`${clean}@`) ||
              uEmail.split("@")[0] === clean ||
              clean.split("@")[0] === uEmail.split("@")[0] ||
              uName === clean ||
              uName.includes(clean) ||
              (clean === "admin" && uRole === "admin") ||
              ((clean === "callcenter" || clean === "call center" || clean === "call_center" || clean === "call desk" || clean === "telecaller") && uRole === "call_center")
            );
          });
          if (user) return user;
        }
      } catch (err) {
        console.warn("Supabase user lookup notice:", err.message);
      }
    }

    // 2. Query pool / in-memory store
    try {
      const { rows } = await pool.query(
        "SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(email) LIKE $2 OR LOWER(name) = $3 OR id = $4",
        [clean, `${clean}@%`, clean, clean]
      );
      if (rows && rows.length > 0) return rows[0];
    } catch (e) {}

    return null;
  },

  // Find user by email
  async findByEmail(email) {
    return this.findByIdentifier(email);
  },

  // Find user by ID (without password)
  async findById(id) {
    if (supabase) {
      try {
        const { data } = await supabase
          .from("users")
          .select("id, name, email, role, phone, avatar, created_at, updated_at")
          .eq("id", id)
          .single();
        if (data) return data;
      } catch (e) {}
    }

    const { rows } = await pool.query(
      "SELECT id, name, email, role, phone, avatar, created_at, updated_at FROM users WHERE id = $1",
      [id]
    );
    return rows[0] || null;
  },

  // Get all users (Admin only)
  async getAll() {
    if (supabase) {
      try {
        const { data } = await supabase
          .from("users")
          .select("id, name, email, role, phone, avatar, created_at, updated_at")
          .order("created_at", { ascending: false });
        if (data && data.length > 0) return data;
      } catch (e) {}
    }

    const { rows } = await pool.query(
      "SELECT id, name, email, role, phone, avatar, created_at, updated_at FROM users ORDER BY created_at DESC"
    );
    return rows;
  },

  // Create a new user (Admin or Telecaller)
  async create({ name, email, password, role = "call_center", phone = null, avatar = null }) {
    const id = `user_${crypto.randomUUID().slice(0, 8)}`;
    const newUser = { id, name, email, password, role, phone, avatar };

    if (supabase) {
      try {
        await supabase.from("users").upsert(newUser);
      } catch (e) {}
    }

    await pool.query(
      `INSERT INTO users (id, name, email, password, role, phone, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name, email, password, role, phone, avatar]
    );
    return this.findById(id);
  },

  // Authenticate credentials against Database & Defaults
  async authenticate(identifier, password) {
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    if (!cleanId || !cleanPass) return null;

    const user = await this.findByIdentifier(cleanId);
    if (user) {
      // Compare password from database
      if (user.password && user.password.trim() === cleanPass) {
        const { password: _, ...safeUser } = user;
        return safeUser;
      }

      // Default pass fallback for admin/telecaller
      if (user.role === "admin" && (cleanPass === "manish1122" || cleanPass === "admin123")) {
        const { password: _, ...safeUser } = user;
        return safeUser;
      }
      if (user.role === "call_center" && (cleanPass === "call123" || cleanPass === "callcenter123")) {
        const { password: _, ...safeUser } = user;
        return safeUser;
      }
    }

    // Default system user fallbacks
    if ((cleanId === "admin" || cleanId.includes("admin") || cleanId === "manish") &&
        (cleanPass === "manish1122" || cleanPass === "admin123")) {
      return {
        id: "user_admin_01",
        name: "Manish",
        email: "admin@emitly.com",
        role: "admin",
        phone: "+91 98765 00001",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      };
    }

    if ((cleanId === "callcenter" || cleanId.includes("call") || cleanId.includes("agent") || cleanId === "sarah" || cleanId === "telecaller") &&
        (cleanPass === "call123" || cleanPass === "callcenter123")) {
      return {
        id: "user_agent_01",
        name: "Sarah (Call Desk)",
        email: "callcenter@emitly.com",
        role: "call_center",
        phone: "+91 98765 00002",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      };
    }

    return null;
  },
};

