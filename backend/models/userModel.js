import pool from "../Db_connection/dbconnection.js";
import { supabase } from "../Db_connection/supabaseClient.js";
import { store } from "../Db_connection/queries.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_META_FILE = path.resolve(__dirname, "../database/users_meta.json");

// Helper to load user assignments metadata
export const loadUsersMeta = () => {
  try {
    if (fs.existsSync(USERS_META_FILE)) {
      const content = fs.readFileSync(USERS_META_FILE, "utf8");
      return JSON.parse(content) || {};
    }
  } catch (e) {
    console.warn("Notice: Could not load users_meta.json:", e.message);
  }
  return {};
};

// Helper to save user assignments metadata
export const saveUsersMeta = (meta) => {
  try {
    const dir = path.dirname(USERS_META_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_META_FILE, JSON.stringify(meta, null, 2), "utf8");
  } catch (e) {
    console.warn("Notice: Could not save users_meta.json:", e.message);
  }
};

// Helper to fetch list of weddings for user enrichment
const getWeddingsSummary = async () => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("weddings").select("id, groom_name, bride_name");
      if (!error && Array.isArray(data) && data.length > 0) return data;
    } catch (e) {}
  }
  if (store && Array.isArray(store.weddings) && store.weddings.length > 0) {
    return store.weddings;
  }
  try {
    const { rows } = await pool.query("SELECT id, groom_name, bride_name FROM weddings");
    return rows || [];
  } catch (e) {
    return [];
  }
};

// Enrich user with persistent wedding assignment metadata
export const enrichUserWithMeta = (user, weddingsList = []) => {
  if (!user) return null;
  const meta = loadUsersMeta();
  const uId = user.id || "";
  const uEmail = (user.email || "").toLowerCase();
  const userMeta = meta[uId] || meta[uEmail] || {};

  const role = user.role || "call_center";
  const weddingId = role === "admin" ? "all" : (userMeta.wedding_id || "all");
  const assignedWeddings = role === "admin"
    ? ["all"]
    : (Array.isArray(userMeta.assigned_weddings) && userMeta.assigned_weddings.length > 0
        ? userMeta.assigned_weddings
        : [weddingId]);

  let assignedWeddingName = "All Marriages";
  if (weddingId && weddingId !== "all") {
    const matched = weddingsList.find((w) => w.id === weddingId);
    if (matched) {
      assignedWeddingName = `${matched.groom_name} & ${matched.bride_name}`;
    } else {
      assignedWeddingName = weddingId;
    }
  }

  return {
    ...user,
    wedding_id: weddingId,
    assigned_weddings: assignedWeddings,
    assigned_wedding_name: assignedWeddingName,
  };
};

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

  // Find user by ID (without password) and enriched with metadata
  async findById(id) {
    let user = null;
    if (supabase) {
      try {
        const { data } = await supabase
          .from("users")
          .select("id, name, email, role, phone, avatar, created_at, updated_at")
          .eq("id", id)
          .single();
        if (data) user = data;
      } catch (e) {}
    }

    if (!user) {
      try {
        const { rows } = await pool.query(
          "SELECT id, name, email, role, phone, avatar, created_at, updated_at FROM users WHERE id = $1",
          [id]
        );
        user = rows[0] || null;
      } catch (e) {}
    }

    if (!user && store && Array.isArray(store.users)) {
      const foundInStore = store.users.find((u) => u.id === id);
      if (foundInStore) {
        const { password: _, ...safeStore } = foundInStore;
        user = safeStore;
      }
    }

    if (!user) return null;

    const weddings = await getWeddingsSummary();
    return enrichUserWithMeta(user, weddings);
  },

  // Get all users (Admin only) with assignments
  async getAll() {
    let rawUsers = [];
    if (supabase) {
      try {
        const { data } = await supabase
          .from("users")
          .select("id, name, email, role, phone, avatar, created_at, updated_at")
          .order("created_at", { ascending: false });
        if (data && data.length > 0) {
          rawUsers = data;
        }
      } catch (e) {}
    }

    if (rawUsers.length === 0) {
      try {
        const { rows } = await pool.query(
          "SELECT id, name, email, role, phone, avatar, created_at, updated_at FROM users ORDER BY created_at DESC"
        );
        rawUsers = rows || [];
      } catch (e) {}
    }

    // Merge in-memory users if any not present
    if (store && Array.isArray(store.users)) {
      for (const memUser of store.users) {
        if (!rawUsers.some((u) => u.id === memUser.id || (memUser.email && u.email === memUser.email))) {
          const { password: _, ...safeMem } = memUser;
          rawUsers.push(safeMem);
        }
      }
    }

    const weddings = await getWeddingsSummary();
    return rawUsers.map((u) => enrichUserWithMeta(u, weddings));
  },

  // Create a new user (Call Center Agent or Admin) with assigned wedding
  async create({
    name,
    email,
    password,
    role = "call_center",
    phone = null,
    avatar = null,
    wedding_id = "all",
    assigned_weddings = null,
  }) {
    const id = `user_${crypto.randomUUID().slice(0, 8)}`;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = (name || "").trim();
    const cleanPassword = (password || "").trim();
    const cleanRole = role || "call_center";
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanWeddingId = wedding_id || "all";
    const assignedList = Array.isArray(assigned_weddings) && assigned_weddings.length > 0
      ? assigned_weddings
      : [cleanWeddingId];
    const now = new Date().toISOString();

    const newUser = {
      id,
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: cleanRole,
      phone: cleanPhone,
      avatar: avatar || null,
      created_at: now,
      updated_at: now,
    };

    // Save to Supabase (only standard columns so PGRST204 is never triggered)
    if (supabase) {
      try {
        await Promise.race([
          supabase.from("users").upsert(newUser),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase upsert timeout")), 2500)),
        ]);
      } catch (e) {
        console.warn("Supabase user create notice:", e.message);
      }
    }

    // Save to pool / in-memory store
    try {
      await pool.query(
        `INSERT INTO users (id, name, email, password, role, phone, avatar)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, cleanName, cleanEmail, cleanPassword, cleanRole, cleanPhone, avatar]
      );
    } catch (e) {}

    if (store && Array.isArray(store.users)) {
      const idx = store.users.findIndex((u) => u.id === id);
      if (idx >= 0) {
        store.users[idx] = { ...store.users[idx], ...newUser };
      } else {
        store.users.push(newUser);
      }
    }

    // Save metadata persistently
    const meta = loadUsersMeta();
    meta[id] = {
      wedding_id: cleanWeddingId,
      assigned_weddings: assignedList,
      updated_at: now,
    };
    if (cleanEmail) {
      meta[cleanEmail] = {
        wedding_id: cleanWeddingId,
        assigned_weddings: assignedList,
      };
    }
    saveUsersMeta(meta);

    return this.findById(id);
  },

  // Update existing user profile or wedding assignment
  async update(id, data) {
    if (!id) return null;
    const existing = await this.findById(id);
    if (!existing) return null;

    const updatedName = data.name !== undefined ? data.name.trim() : existing.name;
    const updatedEmail = data.email !== undefined ? data.email.trim().toLowerCase() : existing.email;
    const updatedPhone = data.phone !== undefined ? (data.phone ? String(data.phone).trim() : null) : existing.phone;
    const updatedRole = data.role !== undefined ? data.role : existing.role;
    const updatedAvatar = data.avatar !== undefined ? data.avatar : existing.avatar;
    const updatedAt = new Date().toISOString();

    const supaPayload = {
      id,
      name: updatedName,
      email: updatedEmail,
      phone: updatedPhone,
      role: updatedRole,
      avatar: updatedAvatar,
      updated_at: updatedAt,
    };

    if (data.password && data.password.trim()) {
      supaPayload.password = data.password.trim();
    }

    // Update in Supabase
    if (supabase) {
      try {
        await Promise.race([
          supabase.from("users").upsert(supaPayload),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase upsert timeout")), 2500)),
        ]);
      } catch (e) {
        console.warn("Supabase user update notice:", e.message);
      }
    }

    // Update in PostgreSQL
    try {
      if (data.password && data.password.trim()) {
        await pool.query(
          `UPDATE users SET name = $1, email = $2, phone = $3, role = $4, avatar = $5, password = $6, updated_at = NOW() WHERE id = $7`,
          [updatedName, updatedEmail, updatedPhone, updatedRole, updatedAvatar, data.password.trim(), id]
        );
      } else {
        await pool.query(
          `UPDATE users SET name = $1, email = $2, phone = $3, role = $4, avatar = $5, updated_at = NOW() WHERE id = $6`,
          [updatedName, updatedEmail, updatedPhone, updatedRole, updatedAvatar, id]
        );
      }
    } catch (e) {
      console.warn("PostgreSQL user update note:", e.message);
    }

    // Update in store.users
    if (store && Array.isArray(store.users)) {
      const idx = store.users.findIndex((u) => u.id === id);
      if (idx >= 0) {
        store.users[idx] = { ...store.users[idx], ...supaPayload };
      }
    }

    // Update metadata if wedding_id or assigned_weddings provided
    if (data.wedding_id !== undefined || data.assigned_weddings !== undefined) {
      const meta = loadUsersMeta();
      const currentMeta = meta[id] || {};
      const newWeddingId = data.wedding_id !== undefined ? data.wedding_id : (currentMeta.wedding_id || "all");
      const newAssignedWeddings = data.assigned_weddings !== undefined
        ? (Array.isArray(data.assigned_weddings) ? data.assigned_weddings : [newWeddingId])
        : (currentMeta.assigned_weddings || [newWeddingId]);

      meta[id] = {
        wedding_id: newWeddingId,
        assigned_weddings: newAssignedWeddings,
        updated_at: updatedAt,
      };
      if (updatedEmail) {
        meta[updatedEmail] = meta[id];
      }
      saveUsersMeta(meta);
    }

    return this.findById(id);
  },

  // Delete user account (Super Admin protected)
  async delete(id) {
    if (!id) return false;
    const user = await this.findById(id);
    if (!user) return false;

    if (user.role === "admin" || user.id === "user_admin_01") {
      throw new Error("Super Admin account cannot be deleted");
    }

    // Delete from Supabase
    if (supabase) {
      try {
        await Promise.race([
          supabase.from("users").delete().eq("id", id),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase delete timeout")), 2500)),
        ]);
      } catch (e) {
        console.warn("Supabase user delete notice:", e.message);
      }
    }

    // Delete from pool / store
    try {
      await pool.query("DELETE FROM users WHERE id = $1", [id]);
    } catch (e) {}
    if (store && Array.isArray(store.users)) {
      store.users = store.users.filter((u) => u.id !== id);
    }

    // Delete from metadata
    const meta = loadUsersMeta();
    delete meta[id];
    if (user.email) delete meta[user.email.toLowerCase()];
    saveUsersMeta(meta);

    return true;
  },

  // Authenticate credentials against Database & Defaults
  async authenticate(identifier, password) {
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    if (!cleanId || !cleanPass) return null;

    const weddings = await getWeddingsSummary();

    const user = await this.findByIdentifier(cleanId);
    if (user) {
      // Compare password from database
      if (user.password && user.password.trim() === cleanPass) {
        const { password: _, ...safeUser } = user;
        return enrichUserWithMeta(safeUser, weddings);
      }

      // Default pass fallback for admin/telecaller
      if (user.role === "admin" && (cleanPass === "manish1122" || cleanPass === "admin123")) {
        const { password: _, ...safeUser } = user;
        return enrichUserWithMeta(safeUser, weddings);
      }
      if (user.role === "call_center" && (cleanPass === "call123" || cleanPass === "callcenter123")) {
        const { password: _, ...safeUser } = user;
        return enrichUserWithMeta(safeUser, weddings);
      }
    }

    // Default system user fallbacks
    if ((cleanId === "admin" || cleanId.includes("admin") || cleanId === "manish") &&
        (cleanPass === "manish1122" || cleanPass === "admin123")) {
      const adminUser = {
        id: "user_admin_01",
        name: "Manish",
        email: "admin@emitly.com",
        role: "admin",
        phone: "+91 98765 00001",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      };
      return enrichUserWithMeta(adminUser, weddings);
    }

    if ((cleanId === "callcenter" || cleanId.includes("call") || cleanId.includes("agent") || cleanId === "sarah" || cleanId === "telecaller") &&
        (cleanPass === "call123" || cleanPass === "callcenter123")) {
      const agentUser = {
        id: "user_agent_01",
        name: "Sarah (Call Desk)",
        email: "callcenter@emitly.com",
        role: "call_center",
        phone: "+91 98765 00002",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      };
      return enrichUserWithMeta(agentUser, weddings);
    }

    return null;
  },
};
