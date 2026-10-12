import pool from "../Db_connection/dbconnection.js";
import { supabase } from "../Db_connection/supabaseClient.js";
import { store } from "../Db_connection/queries.js";
import crypto from "crypto";

export const CallLogModel = {
  // 1. Get all call logs for a specific guest
  async getByGuestId(guestId) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("guest_call_logs")
          .select("*")
          .eq("guest_id", guestId)
          .order("call_number", { ascending: true });
        if (data && !error && data.length > 0) return data;
      } catch (e) {}
    }

    const { rows } = await pool.query(
      `SELECT * FROM guest_call_logs WHERE guest_id = $1 ORDER BY call_number ASC, called_at ASC`,
      [guestId]
    );
    return rows;
  },

  // 2. Get call log by ID
  async getById(id) {
    if (supabase) {
      try {
        const { data } = await supabase.from("guest_call_logs").select("*").eq("id", id).single();
        if (data) return data;
      } catch (e) {}
    }

    const { rows } = await pool.query("SELECT * FROM guest_call_logs WHERE id = $1", [id]);
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
    let nextCallNumber = 1;
    if (supabase) {
      try {
        const { data: existingLogs } = await supabase
          .from("guest_call_logs")
          .select("call_number")
          .eq("guest_id", guest_id);
        if (existingLogs && existingLogs.length > 0) {
          nextCallNumber = Math.max(...existingLogs.map((l) => Number(l.call_number) || 0)) + 1;
        }
      } catch (e) {}
    } else {
      const { rows: countRes } = await pool.query(
        "SELECT COUNT(*)::int AS \"totalCalls\" FROM guest_call_logs WHERE guest_id = $1",
        [guest_id]
      );
      nextCallNumber = (countRes[0]?.totalCalls || 0) + 1;
    }

    const newLogRecord = {
      id,
      guest_id,
      wedding_id,
      call_number: nextCallNumber,
      agent_id: agent_id || null,
      agent_name: agent_name || "Call Desk Agent",
      call_outcome: call_outcome || "Connected",
      call_summary: (call_summary || "").trim(),
      callback_date: callback_date || null,
      called_at: new Date().toISOString(),
    };

    // 1. Sync to Supabase
    if (supabase) {
      try {
        await supabase.from("guest_call_logs").upsert(newLogRecord);
        const guestUpdate = {
          call_count: nextCallNumber,
          call_status: call_outcome,
          last_called_at: new Date().toISOString(),
          last_call_summary: (call_summary || "").trim(),
          updated_at: new Date().toISOString(),
        };
        if (update_rsvp) guestUpdate.rsvp_status = update_rsvp;
        if (special_request && special_request.trim() !== "") {
          guestUpdate.special_request = special_request.trim();
        }
        await supabase.from("guests").update(guestUpdate).eq("id", guest_id);
      } catch (supaErr) {
        console.warn("Supabase call log insert note:", supaErr.message);
      }
    }

    // 2. Keep store in sync
    store.guest_call_logs.push(newLogRecord);
    const guestIdx = store.guests.findIndex((g) => g.id === guest_id);
    if (guestIdx >= 0) {
      store.guests[guestIdx] = {
        ...store.guests[guestIdx],
        call_count: nextCallNumber,
        call_status: call_outcome,
        last_called_at: new Date().toISOString(),
        last_call_summary: (call_summary || "").trim(),
        ...(update_rsvp ? { rsvp_status: update_rsvp } : {}),
        ...(special_request && special_request.trim() !== "" ? { special_request: special_request.trim() } : {}),
      };
    }

    // 3. Insert the call log record in pool fallback
    await pool.query(
      `INSERT INTO guest_call_logs (
        id, guest_id, wedding_id, call_number, agent_id, agent_name,
        call_outcome, call_summary, callback_date, called_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
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

    // 4. Update parent guest record via pool fallback
    let guestUpdateQuery = `
      UPDATE guests SET
        call_count = $1,
        call_status = $2,
        last_called_at = NOW(),
        last_call_summary = $3
    `;
    const guestUpdateParams = [nextCallNumber, call_outcome, call_summary];

    if (update_rsvp) {
      guestUpdateParams.push(update_rsvp);
      guestUpdateQuery += `, rsvp_status = $${guestUpdateParams.length}`;
    }

    if (special_request && special_request.trim() !== "") {
      guestUpdateParams.push(special_request);
      guestUpdateQuery += `, special_request = $${guestUpdateParams.length}`;
    }

    guestUpdateParams.push(guest_id);
    guestUpdateQuery += ` WHERE id = $${guestUpdateParams.length}`;

    await pool.query(guestUpdateQuery, guestUpdateParams);

    return newLogRecord;
  },

  // 4. Update an existing call log entry
  async update(id, { call_outcome, call_summary, callback_date }) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updatedLog = {
      ...existing,
      call_outcome: call_outcome !== undefined ? call_outcome : existing.call_outcome,
      call_summary: call_summary !== undefined ? call_summary : existing.call_summary,
      callback_date: callback_date !== undefined ? callback_date : existing.callback_date,
    };

    if (supabase) {
      try {
        await supabase.from("guest_call_logs").update(updatedLog).eq("id", id);
      } catch (e) {}
    }

    await pool.query(
      `UPDATE guest_call_logs SET
        call_outcome = COALESCE($1, call_outcome),
        call_summary = COALESCE($2, call_summary),
        callback_date = $3
      WHERE id = $4`,
      [
        updatedLog.call_outcome,
        updatedLog.call_summary,
        updatedLog.callback_date,
        id,
      ]
    );

    // Update guest's latest call summary if this was the latest call
    const latestLogs = await this.getByGuestId(existing.guest_id);
    const latest = latestLogs && latestLogs.length > 0 ? latestLogs[latestLogs.length - 1] : null;
    if (latest && latest.id === id) {
      if (supabase) {
        try {
          await supabase
            .from("guests")
            .update({
              call_status: latest.call_outcome,
              last_call_summary: latest.call_summary,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.guest_id);
        } catch (e) {}
      }

      await pool.query(
        "UPDATE guests SET call_status = $1, last_call_summary = $2 WHERE id = $3",
        [latest.call_outcome, latest.call_summary, existing.guest_id]
      );
    }

    return updatedLog;
  },

  // 5. Delete a call log and update guest's call count
  async delete(id) {
    const log = await this.getById(id);
    if (!log) return false;

    if (supabase) {
      try {
        await supabase.from("guest_call_logs").delete().eq("id", id);
      } catch (e) {}
    }

    const result = await pool.query("DELETE FROM guest_call_logs WHERE id = $1", [id]);

    // Recalculate remaining calls count for the guest
    const remainingLogs = await this.getByGuestId(log.guest_id);
    const total = remainingLogs ? remainingLogs.length : 0;
    const latest = remainingLogs && remainingLogs.length > 0 ? remainingLogs[remainingLogs.length - 1] : null;
    const lastCalled = latest ? latest.called_at : null;
    const lastSummary = latest ? latest.call_summary : null;
    const lastOutcome = latest ? latest.call_outcome : (total === 0 ? "Not Called" : "In Progress");

    if (supabase) {
      try {
        await supabase
          .from("guests")
          .update({
            call_count: total,
            call_status: lastOutcome,
            last_called_at: lastCalled,
            last_call_summary: lastSummary,
            updated_at: new Date().toISOString(),
          })
          .eq("id", log.guest_id);
      } catch (e) {}
    }

    await pool.query(
      `UPDATE guests SET call_count = $1, call_status = $2, last_called_at = $3, last_call_summary = $4 WHERE id = $5`,
      [total, lastOutcome, lastCalled, lastSummary, log.guest_id]
    );

    return (result.rowCount || result.affectedRows) > 0;
  },

  // 6. Get calling statistics across a wedding
  async getCallingStats(weddingId = null) {
    let whereClause = "";
    const params = [];
    if (weddingId && weddingId !== "all" && weddingId !== "All") {
      whereClause = " WHERE wedding_id = $1";
      params.push(weddingId);
    }

    const { rows: guestStats } = await pool.query(
      `SELECT 
        COUNT(*)::int AS "totalGuests",
        COALESCE(SUM(CASE WHEN call_count = 0 THEN 1 ELSE 0 END), 0)::int AS "notCalledCount",
        COALESCE(SUM(CASE WHEN call_count = 1 THEN 1 ELSE 0 END), 0)::int AS "call1Count",
        COALESCE(SUM(CASE WHEN call_count = 2 THEN 1 ELSE 0 END), 0)::int AS "call2Count",
        COALESCE(SUM(CASE WHEN call_count >= 3 THEN 1 ELSE 0 END), 0)::int AS "call3CompletedCount",
        COALESCE(SUM(CASE WHEN LOWER(call_status) = 'connected' OR LOWER(call_status) = 'rsvp confirmed' THEN 1 ELSE 0 END), 0)::int AS "connectedCount",
        COALESCE(SUM(CASE WHEN LOWER(call_status) = 'callback requested' THEN 1 ELSE 0 END), 0)::int AS "callbackCount"
      FROM guests ${whereClause}`,
      params
    );

    const { rows: totalCallsRes } = await pool.query(
      `SELECT COUNT(*)::int AS "totalLoggedAttempts" FROM guest_call_logs ${whereClause}`,
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
