import pool from "../Db_connection/dbconnection.js";
import crypto from "crypto";

export const CallLogModel = {
  // 1. Get all call logs for a specific guest
  async getByGuestId(guestId) {
    const [rows] = await pool.query(
      `SELECT * FROM guest_call_logs WHERE guest_id = ? ORDER BY call_number ASC, called_at ASC`,
      [guestId]
    );
    return rows;
  },

  // 2. Get call log by ID
  async getById(id) {
    const [rows] = await pool.query("SELECT * FROM guest_call_logs WHERE id = ?", [id]);
    return rows[0] || null;
  },

  // 3. Log a new call attempt / checkpoint
  async create({
    guest_id,
    wedding_id = "wedding_01",
    agent_id = null,
    agent_name = "Call Desk Agent",
    call_outcome = "Connected",
    call_summary,
    callback_date = null,
    update_rsvp = null, // optional RSVP status update on call
    special_request = null, // optional special request from call
  }) {
    const id = `call_log_${crypto.randomUUID().slice(0, 8)}`;

    // Calculate next call number for this guest
    const [countRes] = await pool.query(
      "SELECT COUNT(*) AS totalCalls FROM guest_call_logs WHERE guest_id = ?",
      [guest_id]
    );
    const nextCallNumber = (countRes[0]?.totalCalls || 0) + 1;

    // 1. Insert the call log record
    await pool.query(
      `INSERT INTO guest_call_logs (
        id, guest_id, wedding_id, call_number, agent_id, agent_name,
        call_outcome, call_summary, callback_date, called_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        guest_id,
        wedding_id,
        nextCallNumber,
        agent_id,
        agent_name,
        call_outcome,
        call_summary,
        callback_date,
      ]
    );

    // 2. Update the parent guest record with new checkpoint count, status and last summary
    let guestUpdateQuery = `
      UPDATE guests SET
        call_count = ?,
        call_status = ?,
        last_called_at = NOW(),
        last_call_summary = ?
    `;
    const guestUpdateParams = [nextCallNumber, call_outcome, call_summary];

    if (update_rsvp) {
      guestUpdateQuery += ", rsvp_status = ?";
      guestUpdateParams.push(update_rsvp);
    }

    if (special_request && special_request.trim() !== "") {
      guestUpdateQuery += ", special_request = ?";
      guestUpdateParams.push(special_request);
    }

    guestUpdateQuery += " WHERE id = ?";
    guestUpdateParams.push(guest_id);

    await pool.query(guestUpdateQuery, guestUpdateParams);

    return this.getById(id);
  },

  // 4. Update an existing call log entry
  async update(id, { call_outcome, call_summary, callback_date }) {
    const existing = await this.getById(id);
    if (!existing) return null;

    await pool.query(
      `UPDATE guest_call_logs SET
        call_outcome = COALESCE(?, call_outcome),
        call_summary = COALESCE(?, call_summary),
        callback_date = ?
      WHERE id = ?`,
      [
        call_outcome !== undefined ? call_outcome : existing.call_outcome,
        call_summary !== undefined ? call_summary : existing.call_summary,
        callback_date !== undefined ? callback_date : existing.callback_date,
        id,
      ]
    );

    // Update guest's latest call summary if this was the latest call
    const [latest] = await pool.query(
      "SELECT * FROM guest_call_logs WHERE guest_id = ? ORDER BY called_at DESC LIMIT 1",
      [existing.guest_id]
    );
    if (latest[0] && latest[0].id === id) {
      await pool.query(
        "UPDATE guests SET call_status = ?, last_call_summary = ? WHERE id = ?",
        [latest[0].call_outcome, latest[0].call_summary, existing.guest_id]
      );
    }

    return this.getById(id);
  },

  // 5. Delete a call log and update guest's call count
  async delete(id) {
    const log = await this.getById(id);
    if (!log) return false;

    const [result] = await pool.query("DELETE FROM guest_call_logs WHERE id = ?", [id]);

    // Recalculate remaining calls count for the guest
    const [countRes] = await pool.query(
      "SELECT COUNT(*) AS totalCalls, MAX(called_at) as lastCalled, (SELECT call_summary FROM guest_call_logs WHERE guest_id = ? ORDER BY called_at DESC LIMIT 1) as lastSummary, (SELECT call_outcome FROM guest_call_logs WHERE guest_id = ? ORDER BY called_at DESC LIMIT 1) as lastOutcome FROM guest_call_logs WHERE guest_id = ?",
      [log.guest_id, log.guest_id, log.guest_id]
    );

    const total = countRes[0]?.totalCalls || 0;
    const lastCalled = countRes[0]?.lastCalled || null;
    const lastSummary = countRes[0]?.lastSummary || null;
    const lastOutcome = countRes[0]?.lastOutcome || (total === 0 ? "Not Called" : "In Progress");

    await pool.query(
      `UPDATE guests SET call_count = ?, call_status = ?, last_called_at = ?, last_call_summary = ? WHERE id = ?`,
      [total, lastOutcome, lastCalled, lastSummary, log.guest_id]
    );

    return result.affectedRows > 0;
  },

  // 6. Get calling statistics across a wedding
  async getCallingStats(weddingId = null) {
    let whereClause = "";
    const params = [];
    if (weddingId && weddingId !== "all" && weddingId !== "All") {
      whereClause = " WHERE wedding_id = ?";
      params.push(weddingId);
    }

    const [guestStats] = await pool.query(
      `SELECT 
        COUNT(*) AS totalGuests,
        SUM(CASE WHEN call_count = 0 THEN 1 ELSE 0 END) AS notCalledCount,
        SUM(CASE WHEN call_count = 1 THEN 1 ELSE 0 END) AS call1Count,
        SUM(CASE WHEN call_count = 2 THEN 1 ELSE 0 END) AS call2Count,
        SUM(CASE WHEN call_count >= 3 THEN 1 ELSE 0 END) AS call3CompletedCount,
        SUM(CASE WHEN LOWER(call_status) = 'connected' OR LOWER(call_status) = 'rsvp confirmed' THEN 1 ELSE 0 END) AS connectedCount,
        SUM(CASE WHEN LOWER(call_status) = 'callback requested' THEN 1 ELSE 0 END) AS callbackCount
      FROM guests ${whereClause}`,
      params
    );

    const [totalCallsRes] = await pool.query(
      `SELECT COUNT(*) AS totalLoggedAttempts FROM guest_call_logs ${whereClause}`,
      params
    );

    const row = guestStats[0] || {};
    return {
      totalGuests: Number(row.totalGuests) || 0,
      totalLoggedAttempts: Number(totalCallsRes[0]?.totalLoggedAttempts) || 0,
      notCalledCount: Number(row.notCalledCount) || 0,
      call1Count: Number(row.call1Count) || 0,
      call2Count: Number(row.call2Count) || 0,
      call3CompletedCount: Number(row.call3CompletedCount) || 0,
      connectedCount: Number(row.connectedCount) || 0,
      callbackCount: Number(row.callbackCount) || 0,
    };
  },
};
