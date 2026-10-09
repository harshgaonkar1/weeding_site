import pool from "../Db_connection/dbconnection.js";
import crypto from "crypto";

export const UserModel = {
  // Find user by email or username
  async findByIdentifier(identifier) {
    const clean = (identifier || "").trim().toLowerCase();
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(email) LIKE $2 OR LOWER(name) = $3",
      [clean, `${clean}@%`, clean]
    );
    return rows[0] || null;
  },

  // Find user by email
  async findByEmail(email) {
    return this.findByIdentifier(email);
  },

  // Find user by ID (without password)
  async findById(id) {
    const { rows } = await pool.query(
      "SELECT id, name, email, role, phone, avatar, created_at, updated_at FROM users WHERE id = $1",
      [id]
    );
    return rows[0] || null;
  },

  // Get all users (Admin only)
  async getAll() {
    const { rows } = await pool.query(
      "SELECT id, name, email, role, phone, avatar, created_at, updated_at FROM users ORDER BY created_at DESC"
    );
    return rows;
  },

  // Create a new user (Admin or Telecaller)
  async create({ name, email, password, role = "call_center", phone = null, avatar = null }) {
    const id = `user_${crypto.randomUUID().slice(0, 8)}`;
    await pool.query(
      `INSERT INTO users (id, name, email, password, role, phone, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name, email, password, role, phone, avatar]
    );
    return this.findById(id);
  },

  // Authenticate credentials
  async authenticate(identifier, password) {
    const user = await this.findByIdentifier(identifier);
    if (!user) return null;
    // Simple direct comparison (and trimmed) for ease of development & customization
    if (user.password !== (password || "").trim()) return null;

    // Return safe user payload (excluding password)
    const { password: _, ...safeUser } = user;
    return safeUser;
  },
};
