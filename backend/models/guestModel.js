import pool from "../Db_connection/dbconnection.js";
import crypto from "crypto";

export const GuestModel = {
  // 1. Get all guests with optional wedding_id, side, search, rsvp, idCard, callStatus, callAttempts filtering
  async getAll({
    weddingId = null,
    side = "All",
    search = "",
    rsvp = "All",
    idCard = "All",
    callStatus = "All",
    callAttempts = "All",
    sortBy = "sr_no",
    order = "ASC",
  } = {}) {
    let query = "SELECT * FROM guests WHERE 1=1";
    const params = [];

    // Wedding isolation filter
    if (weddingId && weddingId !== "All" && weddingId !== "all") {
      params.push(weddingId);
      query += ` AND wedding_id = $${params.length}`;
    }

    // Side filter (Bride / Groom / Both)
    if (side && side !== "All") {
      params.push(side);
      query += ` AND LOWER(side) = LOWER($${params.length})`;
    }

    // Search keyword
    if (search && search.trim() !== "") {
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm);
      const pIdx = params.length;
      query += ` AND (
        guest_name ILIKE $${pIdx} OR 
        contact ILIKE $${pIdx} OR 
        arrival_flight_train_no ILIKE $${pIdx} OR 
        departure_flight_train_no ILIKE $${pIdx} OR 
        arrival_location ILIKE $${pIdx} OR 
        departure_location ILIKE $${pIdx} OR
        special_request ILIKE $${pIdx} OR
        last_call_summary ILIKE $${pIdx}
      )`;
    }

    // RSVP filter
    if (rsvp && rsvp !== "All") {
      params.push(rsvp);
      query += ` AND LOWER(rsvp_status) = LOWER($${params.length})`;
    }

    // ID Card filter
    if (idCard && idCard !== "All") {
      if (idCard === "Received (Yes)" || idCard === "Yes") {
        query += " AND LOWER(id_card_received) = 'yes'";
      } else if (idCard === "Pending (No)" || idCard === "No") {
        query += " AND LOWER(id_card_received) = 'no'";
      }
    }

    // Call status filter (e.g., 'Connected', 'No Answer', 'Callback Requested', 'Not Called')
    if (callStatus && callStatus !== "All") {
      params.push(callStatus);
      query += ` AND LOWER(call_status) = LOWER($${params.length})`;
    }

    // Call attempts filter (0, 1, 2, 3+)
    if (callAttempts && callAttempts !== "All") {
      if (callAttempts === "0" || callAttempts === "Not Called") {
        query += " AND (call_count = 0 OR call_count IS NULL)";
      } else if (callAttempts === "1" || callAttempts === "1 Call") {
        query += " AND call_count = 1";
      } else if (callAttempts === "2" || callAttempts === "2 Calls") {
        query += " AND call_count = 2";
      } else if (callAttempts === "3+" || callAttempts === "3 Calls Completed" || callAttempts === "3") {
        query += " AND call_count >= 3";
      }
    }

    // Sorting
    const allowedSortColumns = [
      "sr_no",
      "guest_name",
      "created_at",
      "arrival_date",
      "departure_date",
      "side",
      "call_count",
      "last_called_at",
    ];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : "sr_no";
    const sortDirection = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

    query += ` ORDER BY ${sortColumn} ${sortDirection}`;

    const { rows } = await pool.query(query, params);
    return rows;
  },

  // 2. Get guest by ID
  async getById(id) {
    const { rows } = await pool.query("SELECT * FROM guests WHERE id = $1", [id]);
    return rows[0] || null;
  },

  // 3. Create a new guest
  async create(data) {
    const id = data.id || `guest_${crypto.randomUUID().slice(0, 8)}`;
    const weddingId = data.wedding_id || "wedding_01";

    // Auto-calculate next sr_no within this wedding if not provided
    let srNo = data.sr_no;
    if (!srNo) {
      const { rows: maxResult } = await pool.query(
        "SELECT (COALESCE(MAX(sr_no), 0) + 1)::int AS \"nextSr\" FROM guests WHERE wedding_id = $1",
        [weddingId]
      );
      srNo = maxResult[0]?.nextSr || 1;
    }

    const query = `
      INSERT INTO guests (
        id, wedding_id, sr_no, guest_name, contact, side, rsvp_status, id_card_received,
        arrival_date, arrival_time, arrival_location, arrival_flight_train_no,
        departure_date, departure_time, departure_location, departure_flight_train_no,
        id_card_copy, special_request, call_count, call_status, last_called_at, last_call_summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    `;

    const values = [
      id,
      weddingId,
      srNo,
      data.guest_name,
      data.contact || null,
      data.side || "Groom",
      data.rsvp_status || "Confirmed",
      data.id_card_received || "No",
      data.arrival_date || null,
      data.arrival_time || null,
      data.arrival_location || null,
      data.arrival_flight_train_no || null,
      data.departure_date || null,
      data.departure_time || null,
      data.departure_location || null,
      data.departure_flight_train_no || null,
      data.id_card_copy || null,
      data.special_request || null,
      data.call_count !== undefined ? Number(data.call_count) : 0,
      data.call_status || "Not Called",
      data.last_called_at || null,
      data.last_call_summary || null,
    ];

    await pool.query(query, values);
    return this.getById(id);
  },

  // 3b. Bulk create multiple guests from Excel / CSV import
  async bulkCreate(weddingId = "wedding_01", guestList = []) {
    if (!guestList || guestList.length === 0) return [];

    const { rows: maxResult } = await pool.query(
      "SELECT COALESCE(MAX(sr_no), 0)::int AS \"maxSr\" FROM guests WHERE wedding_id = $1",
      [weddingId]
    );
    let nextSr = (maxResult[0]?.maxSr || 0) + 1;

    const createdGuests = [];
    for (const data of guestList) {
      if (!data.guest_name || data.guest_name.trim() === "") continue;

      const id = data.id || `guest_${crypto.randomUUID().slice(0, 8)}`;
      const srNo = data.sr_no || nextSr++;

      const query = `
        INSERT INTO guests (
          id, wedding_id, sr_no, guest_name, contact, side, rsvp_status, id_card_received,
          arrival_date, arrival_time, arrival_location, arrival_flight_train_no,
          departure_date, departure_time, departure_location, departure_flight_train_no,
          id_card_copy, special_request, call_count, call_status, last_called_at, last_call_summary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      `;

      const values = [
        id,
        weddingId,
        srNo,
        data.guest_name.trim(),
        data.contact || null,
        data.side || "Groom",
        data.rsvp_status || "Confirmed",
        data.id_card_received || "No",
        data.arrival_date || null,
        data.arrival_time || null,
        data.arrival_location || null,
        data.arrival_flight_train_no || null,
        data.departure_date || null,
        data.departure_time || null,
        data.departure_location || null,
        data.departure_flight_train_no || null,
        data.id_card_copy || null,
        data.special_request || null,
        data.call_count !== undefined ? Number(data.call_count) : 0,
        data.call_status || "Not Called",
        data.last_called_at || null,
        data.last_call_summary || null,
      ];

      await pool.query(query, values);
      createdGuests.push({ id, sr_no: srNo, guest_name: data.guest_name, wedding_id: weddingId });
    }

    return createdGuests;
  },

  // 4. Update an existing guest
  async update(id, data) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const query = `
      UPDATE guests SET
        wedding_id = COALESCE($1, wedding_id),
        sr_no = COALESCE($2, sr_no),
        guest_name = COALESCE($3, guest_name),
        contact = $4,
        side = COALESCE($5, side),
        rsvp_status = COALESCE($6, rsvp_status),
        id_card_received = COALESCE($7, id_card_received),
        arrival_date = $8,
        arrival_time = $9,
        arrival_location = $10,
        arrival_flight_train_no = $11,
        departure_date = $12,
        departure_time = $13,
        departure_location = $14,
        departure_flight_train_no = $15,
        id_card_copy = $16,
        special_request = $17,
        call_count = COALESCE($18, call_count),
        call_status = COALESCE($19, call_status),
        last_called_at = COALESCE($20, last_called_at),
        last_call_summary = COALESCE($21, last_call_summary),
        updated_at = NOW()
      WHERE id = $22
    `;

    const values = [
      data.wedding_id !== undefined ? data.wedding_id : existing.wedding_id,
      data.sr_no !== undefined ? data.sr_no : existing.sr_no,
      data.guest_name !== undefined ? data.guest_name : existing.guest_name,
      data.contact !== undefined ? data.contact : existing.contact,
      data.side !== undefined ? data.side : existing.side,
      data.rsvp_status !== undefined ? data.rsvp_status : existing.rsvp_status,
      data.id_card_received !== undefined ? data.id_card_received : existing.id_card_received,
      data.arrival_date !== undefined ? data.arrival_date : existing.arrival_date,
      data.arrival_time !== undefined ? data.arrival_time : existing.arrival_time,
      data.arrival_location !== undefined ? data.arrival_location : existing.arrival_location,
      data.arrival_flight_train_no !== undefined ? data.arrival_flight_train_no : existing.arrival_flight_train_no,
      data.departure_date !== undefined ? data.departure_date : existing.departure_date,
      data.departure_time !== undefined ? data.departure_time : existing.departure_time,
      data.departure_location !== undefined ? data.departure_location : existing.departure_location,
      data.departure_flight_train_no !== undefined ? data.departure_flight_train_no : existing.departure_flight_train_no,
      data.id_card_copy !== undefined ? data.id_card_copy : existing.id_card_copy,
      data.special_request !== undefined ? data.special_request : existing.special_request,
      data.call_count !== undefined ? Number(data.call_count) : existing.call_count,
      data.call_status !== undefined ? data.call_status : existing.call_status,
      data.last_called_at !== undefined ? data.last_called_at : existing.last_called_at,
      data.last_call_summary !== undefined ? data.last_call_summary : existing.last_call_summary,
      id,
    ];

    await pool.query(query, values);
    return this.getById(id);
  },

  // 5. Delete a guest and their call logs
  async delete(id) {
    await pool.query("DELETE FROM guest_call_logs WHERE guest_id = $1", [id]);
    const result = await pool.query("DELETE FROM guests WHERE id = $1", [id]);
    return (result.rowCount || result.affectedRows) > 0;
  },

  // 6. Get dashboard statistics (optionally scoped to a wedding)
  async getStatistics(weddingId = null) {
    let query = `
      SELECT 
        COUNT(*)::int AS "totalRegistered",
        COALESCE(SUM(CASE WHEN LOWER(rsvp_status) = 'confirmed' THEN 1 ELSE 0 END), 0)::int AS "rsvpConfirmed",
        COALESCE(SUM(CASE WHEN LOWER(rsvp_status) = 'pending' THEN 1 ELSE 0 END), 0)::int AS "rsvpPending",
        COALESCE(SUM(CASE WHEN LOWER(rsvp_status) IN ('declined', 'regret', 'regrets', 'not attending', 'not coming') THEN 1 ELSE 0 END), 0)::int AS "rsvpDeclined",
        COALESCE(SUM(CASE WHEN LOWER(id_card_received) = 'yes' THEN 1 ELSE 0 END), 0)::int AS "idCardReceived",
        COALESCE(SUM(CASE WHEN LOWER(side) = 'bride' THEN 1 ELSE 0 END), 0)::int AS "brideSideCount",
        COALESCE(SUM(CASE WHEN LOWER(side) = 'groom' THEN 1 ELSE 0 END), 0)::int AS "groomSideCount",
        COALESCE(SUM(CASE WHEN LOWER(side) = 'both' THEN 1 ELSE 0 END), 0)::int AS "bothSideCount",

        -- RSVP Confirmed Breakdown
        COALESCE(SUM(CASE WHEN LOWER(rsvp_status) = 'confirmed' AND LOWER(side) = 'groom' THEN 1 ELSE 0 END), 0)::int AS "groomRsvpConfirmed",
        COALESCE(SUM(CASE WHEN LOWER(rsvp_status) = 'confirmed' AND LOWER(side) = 'bride' THEN 1 ELSE 0 END), 0)::int AS "brideRsvpConfirmed",
        COALESCE(SUM(CASE WHEN LOWER(rsvp_status) = 'confirmed' AND LOWER(side) = 'both' THEN 1 ELSE 0 END), 0)::int AS "bothRsvpConfirmed",

        -- RSVP Pending Breakdown
        COALESCE(SUM(CASE WHEN LOWER(rsvp_status) = 'pending' AND LOWER(side) = 'groom' THEN 1 ELSE 0 END), 0)::int AS "groomRsvpPending",
        COALESCE(SUM(CASE WHEN LOWER(rsvp_status) = 'pending' AND LOWER(side) = 'bride' THEN 1 ELSE 0 END), 0)::int AS "brideRsvpPending",
        COALESCE(SUM(CASE WHEN LOWER(rsvp_status) = 'pending' AND LOWER(side) = 'both' THEN 1 ELSE 0 END), 0)::int AS "bothRsvpPending",

        -- RSVP Declined / Regrets Breakdown
        COALESCE(SUM(CASE WHEN LOWER(rsvp_status) IN ('declined', 'regret', 'regrets', 'not attending', 'not coming') AND LOWER(side) = 'groom' THEN 1 ELSE 0 END), 0)::int AS "groomRsvpDeclined",
        COALESCE(SUM(CASE WHEN LOWER(rsvp_status) IN ('declined', 'regret', 'regrets', 'not attending', 'not coming') AND LOWER(side) = 'bride' THEN 1 ELSE 0 END), 0)::int AS "brideRsvpDeclined",
        COALESCE(SUM(CASE WHEN LOWER(rsvp_status) IN ('declined', 'regret', 'regrets', 'not attending', 'not coming') AND LOWER(side) = 'both' THEN 1 ELSE 0 END), 0)::int AS "bothRsvpDeclined",

        -- ID Card Breakdown
        COALESCE(SUM(CASE WHEN LOWER(id_card_received) = 'yes' AND LOWER(side) = 'groom' THEN 1 ELSE 0 END), 0)::int AS "groomIdCardReceived",
        COALESCE(SUM(CASE WHEN LOWER(id_card_received) = 'yes' AND LOWER(side) = 'bride' THEN 1 ELSE 0 END), 0)::int AS "brideIdCardReceived",
        COALESCE(SUM(CASE WHEN LOWER(id_card_received) = 'yes' AND LOWER(side) = 'both' THEN 1 ELSE 0 END), 0)::int AS "bothIdCardReceived",

        -- Confirmed Flight / Travel Details Breakdown
        COALESCE(SUM(CASE WHEN (arrival_flight_train_no IS NOT NULL AND TRIM(arrival_flight_train_no) != '') 
                   OR (arrival_date IS NOT NULL AND TRIM(arrival_date) != '')
                   OR (departure_flight_train_no IS NOT NULL AND TRIM(departure_flight_train_no) != '')
                   OR (departure_date IS NOT NULL AND TRIM(departure_date) != '') 
            THEN 1 ELSE 0 END), 0)::int AS "flightDetailsReceived",

        COALESCE(SUM(CASE WHEN ((arrival_flight_train_no IS NOT NULL AND TRIM(arrival_flight_train_no) != '') 
                   OR (arrival_date IS NOT NULL AND TRIM(arrival_date) != '')
                   OR (departure_flight_train_no IS NOT NULL AND TRIM(departure_flight_train_no) != '')
                   OR (departure_date IS NOT NULL AND TRIM(departure_date) != ''))
                   AND LOWER(side) = 'groom'
            THEN 1 ELSE 0 END), 0)::int AS "groomFlightDetailsReceived",

        COALESCE(SUM(CASE WHEN ((arrival_flight_train_no IS NOT NULL AND TRIM(arrival_flight_train_no) != '') 
                   OR (arrival_date IS NOT NULL AND TRIM(arrival_date) != '')
                   OR (departure_flight_train_no IS NOT NULL AND TRIM(departure_flight_train_no) != '')
                   OR (departure_date IS NOT NULL AND TRIM(departure_date) != ''))
                   AND LOWER(side) = 'bride'
            THEN 1 ELSE 0 END), 0)::int AS "brideFlightDetailsReceived",

        COALESCE(SUM(CASE WHEN ((arrival_flight_train_no IS NOT NULL AND TRIM(arrival_flight_train_no) != '') 
                   OR (arrival_date IS NOT NULL AND TRIM(arrival_date) != '')
                   OR (departure_flight_train_no IS NOT NULL AND TRIM(departure_flight_train_no) != '')
                   OR (departure_date IS NOT NULL AND TRIM(departure_date) != ''))
                   AND LOWER(side) = 'both'
            THEN 1 ELSE 0 END), 0)::int AS "bothFlightDetailsReceived",

        -- Call Checkpoints Breakdown
        COALESCE(SUM(CASE WHEN call_count >= 3 AND LOWER(side) = 'groom' THEN 1 ELSE 0 END), 0)::int AS "groomCall3CompletedCount",
        COALESCE(SUM(CASE WHEN call_count >= 3 AND LOWER(side) = 'bride' THEN 1 ELSE 0 END), 0)::int AS "brideCall3CompletedCount",
        COALESCE(SUM(CASE WHEN (call_count < 3 OR call_count IS NULL) AND LOWER(side) = 'groom' THEN 1 ELSE 0 END), 0)::int AS "groomCallsInProgress",
        COALESCE(SUM(CASE WHEN (call_count < 3 OR call_count IS NULL) AND LOWER(side) = 'bride' THEN 1 ELSE 0 END), 0)::int AS "brideCallsInProgress",

        COALESCE(SUM(CASE WHEN special_request IS NOT NULL AND TRIM(special_request) != '' THEN 1 ELSE 0 END), 0)::int AS "specialRequests",
        COALESCE(SUM(CASE WHEN call_count = 0 OR call_count IS NULL THEN 1 ELSE 0 END), 0)::int AS "notCalledCount",
        COALESCE(SUM(CASE WHEN call_count = 1 THEN 1 ELSE 0 END), 0)::int AS "call1Count",
        COALESCE(SUM(CASE WHEN call_count = 2 THEN 1 ELSE 0 END), 0)::int AS "call2Count",
        COALESCE(SUM(CASE WHEN call_count >= 3 THEN 1 ELSE 0 END), 0)::int AS "call3CompletedCount",
        COALESCE(SUM(CASE WHEN LOWER(call_status) = 'connected' OR LOWER(call_status) = 'rsvp confirmed' THEN 1 ELSE 0 END), 0)::int AS "callConnectedCount",
        COALESCE(SUM(CASE WHEN LOWER(call_status) = 'callback requested' THEN 1 ELSE 0 END), 0)::int AS "callbackCount"
      FROM guests
    `;
    const params = [];
    if (weddingId && weddingId !== "All" && weddingId !== "all") {
      params.push(weddingId);
      query += " WHERE wedding_id = $1";
    }

    const { rows } = await pool.query(query, params);
    const stats = rows[0] || {};
    const total = Number(stats.totalRegistered) || 0;
    const confirmed = Number(stats.rsvpConfirmed) || 0;
    const idReceived = Number(stats.idCardReceived) || 0;
    const flightReceived = Number(stats.flightDetailsReceived) || 0;
    const specialReq = Number(stats.specialRequests) || 0;
    const call3Done = Number(stats.call3CompletedCount) || 0;

    return {
      totalRegistered: total,
      groomSideCount: Number(stats.groomSideCount) || 0,
      brideSideCount: Number(stats.brideSideCount) || 0,
      bothSideCount: Number(stats.bothSideCount) || 0,

      rsvpConfirmed: confirmed,
      rsvpConfirmedPercentage: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      groomRsvpConfirmed: Number(stats.groomRsvpConfirmed) || 0,
      brideRsvpConfirmed: Number(stats.brideRsvpConfirmed) || 0,
      bothRsvpConfirmed: Number(stats.bothRsvpConfirmed) || 0,

      rsvpPending: Number(stats.rsvpPending) || 0,
      rsvpPendingPercentage: total > 0 ? Math.round(((Number(stats.rsvpPending) || 0) / total) * 100) : 0,
      groomRsvpPending: Number(stats.groomRsvpPending) || 0,
      brideRsvpPending: Number(stats.brideRsvpPending) || 0,
      bothRsvpPending: Number(stats.bothRsvpPending) || 0,

      rsvpDeclined: Number(stats.rsvpDeclined) || 0,
      rsvpDeclinedPercentage: total > 0 ? Math.round(((Number(stats.rsvpDeclined) || 0) / total) * 100) : 0,
      groomRsvpDeclined: Number(stats.groomRsvpDeclined) || 0,
      brideRsvpDeclined: Number(stats.brideRsvpDeclined) || 0,
      bothRsvpDeclined: Number(stats.bothRsvpDeclined) || 0,

      idCardReceived: idReceived,
      idCardReceivedPercentage: total > 0 ? Math.round((idReceived / total) * 100) : 0,
      groomIdCardReceived: Number(stats.groomIdCardReceived) || 0,
      brideIdCardReceived: Number(stats.brideIdCardReceived) || 0,
      bothIdCardReceived: Number(stats.bothIdCardReceived) || 0,

      flightDetailsReceived: flightReceived,
      flightDetailsPercentage: total > 0 ? Math.round((flightReceived / total) * 100) : 0,
      groomFlightDetailsReceived: Number(stats.groomFlightDetailsReceived) || 0,
      brideFlightDetailsReceived: Number(stats.brideFlightDetailsReceived) || 0,
      bothFlightDetailsReceived: Number(stats.bothFlightDetailsReceived) || 0,

      specialRequests: specialReq,
      notCalledCount: Number(stats.notCalledCount) || 0,
      call1Count: Number(stats.call1Count) || 0,
      call2Count: Number(stats.call2Count) || 0,
      call3CompletedCount: call3Done,
      call3Percentage: total > 0 ? Math.round((call3Done / total) * 100) : 0,
      groomCall3CompletedCount: Number(stats.groomCall3CompletedCount) || 0,
      brideCall3CompletedCount: Number(stats.brideCall3CompletedCount) || 0,
      groomCallsInProgress: Number(stats.groomCallsInProgress) || 0,
      brideCallsInProgress: Number(stats.brideCallsInProgress) || 0,
      callConnectedCount: Number(stats.callConnectedCount) || 0,
      callbackCount: Number(stats.callbackCount) || 0,
    };
  },
};
