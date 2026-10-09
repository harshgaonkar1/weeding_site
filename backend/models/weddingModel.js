import pool from "../Db_connection/dbconnection.js";
import crypto from "crypto";
import { GoogleSheetsService } from "../services/googleSheetsService.js";

export const WeddingModel = {
  // 1. Get all weddings with guest counts and stats
  async getAll() {
    const query = `
      SELECT 
        w.*,
        COUNT(g.id)::int AS total_guests,
        COALESCE(SUM(CASE WHEN LOWER(g.rsvp_status) = 'confirmed' THEN 1 ELSE 0 END), 0)::int AS confirmed_guests,
        COALESCE(SUM(CASE WHEN LOWER(g.side) = 'bride' THEN 1 ELSE 0 END), 0)::int AS bride_guests,
        COALESCE(SUM(CASE WHEN LOWER(g.side) = 'groom' THEN 1 ELSE 0 END), 0)::int AS groom_guests
      FROM weddings w
      LEFT JOIN guests g ON w.id = g.wedding_id
      GROUP BY w.id
      ORDER BY w.wedding_date ASC, w.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // 2. Get single wedding by ID
  async getById(id) {
    const query = `
      SELECT 
        w.*,
        COUNT(g.id)::int AS total_guests,
        COALESCE(SUM(CASE WHEN LOWER(g.rsvp_status) = 'confirmed' THEN 1 ELSE 0 END), 0)::int AS confirmed_guests,
        COALESCE(SUM(CASE WHEN LOWER(g.side) = 'bride' THEN 1 ELSE 0 END), 0)::int AS bride_guests,
        COALESCE(SUM(CASE WHEN LOWER(g.side) = 'groom' THEN 1 ELSE 0 END), 0)::int AS groom_guests
      FROM weddings w
      LEFT JOIN guests g ON w.id = g.wedding_id
      WHERE w.id = $1
      GROUP BY w.id
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  // 3. Create wedding / marriage card (with auto-generated client credentials & Google Sheet)
  async create(data) {
    const id = data.id || `wedding_${crypto.randomUUID().slice(0, 8)}`;
    
    // Auto-generate client username if not provided
    const groomFirst = (data.groom_name || "groom").trim().split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const brideFirst = (data.bride_name || "bride").trim().split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const defaultUsername = `${groomFirst}_${brideFirst}`;
    const client_username = (data.client_username && data.client_username.trim()) || defaultUsername;

    // Auto-generate client password if not provided
    const year = data.wedding_date ? data.wedding_date.slice(0, 4) : new Date().getFullYear();
    const defaultPassword = `${groomFirst.charAt(0).toUpperCase() + groomFirst.slice(1)}@${year}`;
    const client_password = (data.client_password && data.client_password.trim()) || defaultPassword;

    // Generate or real create Google Sheet via Google Sheets API
    let google_sheet_id = data.google_sheet_id;
    let google_sheet_url = data.google_sheet_url;
    let google_sheet_sync_status = data.google_sheet_sync_status || "connected";

    if (!google_sheet_id || !google_sheet_url) {
      try {
        const sheetMeta = await GoogleSheetsService.generateOrRealCreateSheet({
          ...data,
          id,
        });
        google_sheet_id = sheetMeta.google_sheet_id;
        google_sheet_url = sheetMeta.google_sheet_url;
        google_sheet_sync_status = sheetMeta.google_sheet_sync_status;
      } catch (err) {
        console.warn("⚠️ Google Sheet auto-creation note:", err.message);
      }
    }

    const query = `
      INSERT INTO weddings (
        id, groom_name, bride_name, wedding_date, venue, city, cover_theme, notes, 
        client_username, client_password, google_sheet_id, google_sheet_url, google_sheet_sync_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;
    const values = [
      id,
      data.groom_name,
      data.bride_name,
      data.wedding_date || null,
      data.venue || null,
      data.city || null,
      data.cover_theme || "emerald",
      data.notes || null,
      client_username,
      client_password,
      google_sheet_id,
      google_sheet_url,
      google_sheet_sync_status,
    ];
    await pool.query(query, values);
    return this.getById(id);
  },

  // 4. Update wedding
  async update(id, data) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const query = `
      UPDATE weddings SET
        groom_name = COALESCE($1, groom_name),
        bride_name = COALESCE($2, bride_name),
        wedding_date = $3,
        venue = $4,
        city = $5,
        cover_theme = COALESCE($6, cover_theme),
        notes = $7,
        client_username = COALESCE($8, client_username),
        client_password = COALESCE($9, client_password),
        google_sheet_id = COALESCE($10, google_sheet_id),
        google_sheet_url = COALESCE($11, google_sheet_url),
        google_sheet_sync_status = COALESCE($12, google_sheet_sync_status),
        google_sheet_last_synced = COALESCE($13, google_sheet_last_synced),
        updated_at = NOW()
      WHERE id = $14
    `;
    const values = [
      data.groom_name !== undefined ? data.groom_name : existing.groom_name,
      data.bride_name !== undefined ? data.bride_name : existing.bride_name,
      data.wedding_date !== undefined ? data.wedding_date : existing.wedding_date,
      data.venue !== undefined ? data.venue : existing.venue,
      data.city !== undefined ? data.city : existing.city,
      data.cover_theme !== undefined ? data.cover_theme : existing.cover_theme,
      data.notes !== undefined ? data.notes : existing.notes,
      data.client_username !== undefined ? data.client_username : existing.client_username,
      data.client_password !== undefined ? data.client_password : existing.client_password,
      data.google_sheet_id !== undefined ? data.google_sheet_id : existing.google_sheet_id,
      data.google_sheet_url !== undefined ? data.google_sheet_url : existing.google_sheet_url,
      data.google_sheet_sync_status !== undefined ? data.google_sheet_sync_status : existing.google_sheet_sync_status,
      data.google_sheet_last_synced !== undefined ? data.google_sheet_last_synced : existing.google_sheet_last_synced,
      id,
    ];
    await pool.query(query, values);
    return this.getById(id);
  },

  // 5. Authenticate wedding client credentials
  async findByClientCredentials(usernameOrEmail, password) {
    const cleanIdentifier = (usernameOrEmail || "").trim().toLowerCase();
    const query = `
      SELECT * FROM weddings 
      WHERE (LOWER(client_username) = $1 OR id = $2 OR LOWER(client_username) = $3)
    `;
    const { rows } = await pool.query(query, [
      cleanIdentifier,
      usernameOrEmail,
      cleanIdentifier.replace("@weddingportal.com", ""),
    ]);

    if (!rows || rows.length === 0) return null;
    const wedding = rows[0];

    // Password comparison
    if (wedding.client_password && wedding.client_password.trim() === (password || "").trim()) {
      return wedding;
    }
    return null;
  },

  // 6. Delete wedding and all its associated guests and call logs
  async delete(id) {
    // 1. Delete associated call logs
    await pool.query("DELETE FROM guest_call_logs WHERE wedding_id = $1", [id]).catch(() => {});
    
    // 2. Delete associated guests
    await pool.query("DELETE FROM guests WHERE wedding_id = $1", [id]);
    
    // 3. Delete the wedding record
    const result = await pool.query("DELETE FROM weddings WHERE id = $1", [id]);
    return (result.rowCount || result.affectedRows) > 0;
  },
};
