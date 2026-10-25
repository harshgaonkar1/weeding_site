// ============================================================
// Database Queries & Execution Engine
// ------------------------------------------------------------
// Centralizes all database queries, query execution, and data operations
// connected to Supabase JS Client.
// ============================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "./supabaseClient.js";
import { generate500GuestsForRohanPriya } from "../services/guestGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MESSAGES_FILE = path.resolve(__dirname, "../database/messages_store.json");

// Helper to save messages to local file
export const saveMessagesToFile = () => {
  try {
    const dir = path.dirname(MESSAGES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(store.messages || [], null, 2), "utf8");
  } catch (e) {
    console.warn("Notice: Could not write messages_store.json:", e.message);
  }
};

// Helper to load messages from local file
const loadMessagesFromFile = () => {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const content = fs.readFileSync(MESSAGES_FILE, "utf8");
      const list = JSON.parse(content);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (e) {
    console.warn("Notice: Could not load messages_store.json:", e.message);
  }
  return null;
};

// ============================================================
// In-Memory Data Store (Synchronized with Supabase)
// ============================================================
export const store = {
  users: [
    {
      id: "user_admin_01",
      name: "Manish",
      email: "admin@emitly.com",
      password: "manish1122",
      role: "admin",
      phone: "+91 98765 00001",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "user_agent_01",
      name: "Sarah (Call Center Desk)",
      email: "callcenter@emitly.com",
      password: "call123",
      role: "call_center",
      phone: "+91 98765 00002",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  weddings: [
    {
      id: "wedding_01",
      groom_name: "Aaditya Roy",
      bride_name: "Ananya Sharma",
      wedding_date: "2026-11-28",
      venue: "The Oberoi Udaivilas",
      city: "Udaipur, Rajasthan",
      cover_theme: "emerald",
      notes: "Royal Palace Wedding with 3-day celebrations",
      client_username: "aaditya_ananya",
      client_password: "Aaditya@2026",
      google_sheet_id: "wed_aaditya_ananya_01",
      google_sheet_url: "https://docs.google.com/spreadsheets/d/wed_aaditya_ananya_01/edit",
      google_sheet_sync_status: "connected",
      google_sheet_last_synced: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "wedding_02",
      groom_name: "Rohan Varma",
      bride_name: "Priya Desai",
      wedding_date: "2026-12-15",
      venue: "Taj Exotica Resort & Spa",
      city: "Goa",
      cover_theme: "rose",
      notes: "Beachside sunset wedding and Sangeet evening",
      client_username: "rohan_priya",
      client_password: "Rohan@2026",
      google_sheet_id: "wed_rohan_priya_02",
      google_sheet_url: "https://docs.google.com/spreadsheets/d/wed_rohan_priya_02/edit",
      google_sheet_sync_status: "connected",
      google_sheet_last_synced: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "wedding_03",
      groom_name: "Aarav Kapoor",
      bride_name: "Meera Singhania",
      wedding_date: "2027-01-20",
      venue: "ITC Grand Chola",
      city: "Chennai",
      cover_theme: "purple",
      notes: "Traditional South Indian & North Indian fusion wedding",
      client_username: "aarav_meera",
      client_password: "Aarav@2027",
      google_sheet_id: "wed_aarav_meera_03",
      google_sheet_url: "https://docs.google.com/spreadsheets/d/wed_aarav_meera_03/edit",
      google_sheet_sync_status: "connected",
      google_sheet_last_synced: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  guests: [
    {
      id: "guest_viggnesh_02",
      wedding_id: "wedding_01",
      sr_no: 2,
      guest_name: "Viggnesh",
      contact: "88888888",
      side: "Groom",
      rsvp_status: "Confirmed",
      id_card_received: "Yes",
      arrival_date: "2026-09-07",
      arrival_time: "10:00 AM",
      arrival_location: "Mumbai Int. Airport (T2)",
      arrival_flight_train_no: "AI-682",
      departure_date: "2026-09-10",
      departure_time: "06:30 PM",
      departure_location: "Mumbai Int. Airport (T2)",
      departure_flight_train_no: "AI-894",
      id_card_copy: null,
      special_request: "Vegetarian breakfast preference",
      call_count: 3,
      call_status: "RSVP Confirmed",
      last_called_at: "2026-09-20T11:30:00Z",
      last_call_summary: "Confirmed 3-day stay and room requirement. Requested airport cab on arrival.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "guest_manish_04",
      wedding_id: "wedding_01",
      sr_no: 4,
      guest_name: "Manish",
      contact: "352148752",
      side: "Bride",
      rsvp_status: "Confirmed",
      id_card_received: "Yes",
      arrival_date: "2024-09-20",
      arrival_time: "02:15 PM",
      arrival_location: "Delhi Airport Terminal 3",
      arrival_flight_train_no: "6E-409",
      departure_date: "2024-09-23",
      departure_time: "11:00 AM",
      departure_location: "Delhi Airport Terminal 3",
      departure_flight_train_no: "6E-412",
      id_card_copy: "government_id_verified.pdf",
      special_request: "Window seat preference & hotel shuttle pickup",
      call_count: 1,
      call_status: "Connected",
      last_called_at: "2026-09-22T15:00:00Z",
      last_call_summary: "Guest confirmed they will reach Terminal 3 on time. Needs hotel shuttle.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    ...generate500GuestsForRohanPriya(),
  ],
  guest_call_logs: [
    {
      id: "call_log_01",
      guest_id: "guest_viggnesh_02",
      wedding_id: "wedding_01",
      call_number: 1,
      agent_name: "Sarah (Call Desk)",
      call_outcome: "No Answer",
      call_summary: "Called at 11:00 AM. Phone rang without answer. Scheduled 2nd attempt for tomorrow.",
      called_at: "2026-09-18T11:00:00Z",
    },
    {
      id: "call_log_02",
      guest_id: "guest_viggnesh_02",
      wedding_id: "wedding_01",
      call_number: 2,
      agent_name: "Sarah (Call Desk)",
      call_outcome: "Connected",
      call_summary: "Spoke with guest. He requested time till evening to verify flight AI-682 tickets.",
      called_at: "2026-09-19T14:30:00Z",
    },
    {
      id: "call_log_03",
      guest_id: "guest_viggnesh_02",
      wedding_id: "wedding_01",
      call_number: 3,
      agent_name: "Sarah (Call Desk)",
      call_outcome: "RSVP Confirmed",
      call_summary: "3rd call checkpoint complete. Confirmed 3-day stay, vegetarian breakfast, and cab pickup at Mumbai T2.",
      called_at: "2026-09-20T11:30:00Z",
    },
    {
      id: "call_log_04",
      guest_id: "guest_manish_04",
      wedding_id: "wedding_01",
      call_number: 1,
      agent_name: "Sarah (Call Desk)",
      call_outcome: "Connected",
      call_summary: "1st call checkpoint: Guest confirmed they will reach Terminal 3 on time. Needs hotel shuttle pickup.",
      called_at: "2026-09-22T15:00:00Z",
    },
  ],
  messages: [
    {
      id: "msg_seed_01",
      wedding_id: "wedding_01",
      sender_id: "user_admin_01",
      sender_name: "Manish (Admin)",
      sender_role: "admin",
      message: "Hello Aaditya & Ananya! Welcome to your live wedding portal. Our logistics and telecaller team is actively monitoring guest arrivals and RSVP confirmations.",
      is_read: true,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: "msg_seed_02",
      wedding_id: "wedding_01",
      sender_id: "client_aaditya_ananya",
      sender_name: "Aaditya Roy",
      sender_role: "client",
      message: "Hi Manish, thank you! Could you please make sure the airport shuttle is confirmed for the guests arriving on 27th Nov at Mumbai T2 / Udaipur Airport?",
      is_read: true,
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: "msg_seed_03",
      wedding_id: "wedding_01",
      sender_id: "user_admin_01",
      sender_name: "Manish (Admin)",
      sender_role: "admin",
      message: "Absolutely! The telecaller desk has logged their flight numbers (AI-682). We have dedicated Innovas on standby at the airport terminal.",
      is_read: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ],
};

// Initialize store messages from local file if available
const _savedMessages = loadMessagesFromFile();
if (_savedMessages && _savedMessages.length > 0) {
  store.messages = _savedMessages;
}


// ============================================================
// Helper Result Wrapper
// ============================================================
const formatResult = (rows) => {
  const resultObj = { rows, rowCount: rows.length, affectedRows: rows.length };
  return Object.assign([...rows], resultObj, { rows, rowCount: rows.length, affectedRows: rows.length });
};

// ============================================================
// Execute Query Function
// ============================================================
export const query = async (text, params = []) => {
  const sql = (text || "").trim();
  const lowerSql = sql.toLowerCase();

  // ============================================================
  // A. DELETE OPERATIONS (Checked first to prevent 'from' conflicts)
  // ============================================================
  if (lowerSql.startsWith("delete from weddings")) {
    const id = params[0];
    const initialLen = store.weddings.length;
    store.weddings = store.weddings.filter((w) => w.id !== id);
    store.guests = store.guests.filter((g) => g.wedding_id !== id);
    store.guest_call_logs = store.guest_call_logs.filter((c) => c.wedding_id !== id);
    store.messages = (store.messages || []).filter((m) => m.wedding_id !== id);
    saveMessagesToFile();

    if (supabase) {
      try {
        await supabase.from("wedding_messages").delete().eq("wedding_id", id);
        await supabase.from("guest_call_logs").delete().eq("wedding_id", id);
        await supabase.from("guests").delete().eq("wedding_id", id);
        await supabase.from("weddings").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase wedding delete notice:", err.message);
      }
    }
    const affected = Math.max(1, initialLen - store.weddings.length);
    return formatResult(new Array(affected).fill({ id }));
  }

  if (lowerSql.startsWith("delete from wedding_messages")) {
    const weddingId = params[0];
    const initialLen = (store.messages || []).length;
    store.messages = (store.messages || []).filter((m) => m.wedding_id !== weddingId);
    saveMessagesToFile();

    if (supabase) {
      try {
        await supabase.from("wedding_messages").delete().eq("wedding_id", weddingId);
      } catch (err) {
        console.warn("Supabase wedding_messages delete notice:", err.message);
      }
    }
    const affected = Math.max(1, initialLen - (store.messages || []).length);
    return formatResult(new Array(affected).fill({ wedding_id: weddingId }));
  }

  if (lowerSql.startsWith("delete from guests")) {
    const id = params[0];
    const initialLen = store.guests.length;
    store.guests = store.guests.filter((g) => g.id !== id && g.wedding_id !== id);
    store.guest_call_logs = store.guest_call_logs.filter((c) => c.guest_id !== id && c.wedding_id !== id);

    if (supabase) {
      try {
        if (lowerSql.includes("where wedding_id = $1")) {
          await supabase.from("guest_call_logs").delete().eq("wedding_id", id);
          await supabase.from("guests").delete().eq("wedding_id", id);
        } else {
          await supabase.from("guest_call_logs").delete().eq("guest_id", id);
          await supabase.from("guests").delete().eq("id", id);
        }
      } catch (err) {
        console.warn("Supabase guest delete notice:", err.message);
      }
    }
    const affected = Math.max(1, initialLen - store.guests.length);
    return formatResult(new Array(affected).fill({ id }));
  }

  if (lowerSql.startsWith("delete from guest_call_logs")) {
    const id = params[0];
    const initialLen = store.guest_call_logs.length;
    store.guest_call_logs = store.guest_call_logs.filter(
      (c) => c.id !== id && c.wedding_id !== id && c.guest_id !== id
    );

    if (supabase) {
      try {
        if (lowerSql.includes("where wedding_id = $1")) {
          await supabase.from("guest_call_logs").delete().eq("wedding_id", id);
        } else if (lowerSql.includes("where guest_id = $1")) {
          await supabase.from("guest_call_logs").delete().eq("guest_id", id);
        } else {
          await supabase.from("guest_call_logs").delete().eq("id", id);
        }
      } catch (err) {
        console.warn("Supabase log delete notice:", err.message);
      }
    }
    const affected = Math.max(1, initialLen - store.guest_call_logs.length);
    return formatResult(new Array(affected).fill({ id }));
  }

  // ============================================================
  // B. INSERT OPERATIONS
  // ============================================================
  if (lowerSql.startsWith("insert into users")) {
    const newUser = {
      id: params[0],
      name: params[1],
      email: params[2],
      password: params[3],
      role: params[4] || "call_center",
      phone: params[5] || null,
      avatar: params[6] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const idx = store.users.findIndex((u) => u.id === newUser.id || u.email === newUser.email);
    if (idx >= 0) {
      store.users[idx] = { ...store.users[idx], ...newUser };
    } else {
      store.users.push(newUser);
    }
    if (supabase) {
      try {
        await supabase.from("users").upsert(newUser);
      } catch (err) {
        console.warn("Supabase user insert notice:", err.message);
      }
    }
    return formatResult([newUser]);
  }

  if (lowerSql.startsWith("insert into weddings")) {
    const newWedding = {
      id: params[0],
      groom_name: params[1],
      bride_name: params[2],
      wedding_date: params[3] || null,
      venue: params[4] || null,
      city: params[5] || null,
      cover_theme: params[6] || "emerald",
      notes: params[7] || null,
      client_username: params[8] || null,
      client_password: params[9] || null,
      google_sheet_id: params[10] || null,
      google_sheet_url: params[11] || null,
      google_sheet_sync_status: params[12] || "connected",
      google_sheet_last_synced: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const idx = store.weddings.findIndex((w) => w.id === newWedding.id);
    if (idx >= 0) {
      store.weddings[idx] = { ...store.weddings[idx], ...newWedding };
    } else {
      store.weddings.push(newWedding);
    }
    if (supabase) {
      try {
        await supabase.from("weddings").upsert(newWedding);
      } catch (err) {
        console.warn("Supabase wedding insert notice:", err.message);
      }
    }
    return formatResult([newWedding]);
  }

  if (lowerSql.startsWith("insert into guests")) {
    const newGuest = {
      id: params[0],
      wedding_id: params[1] || "wedding_01",
      sr_no: Number(params[2]) || 1,
      guest_name: params[3],
      contact: params[4] || null,
      side: params[5] || "Groom",
      rsvp_status: params[6] || "Confirmed",
      id_card_received: params[7] || "No",
      arrival_date: params[8] || null,
      arrival_time: params[9] || null,
      arrival_location: params[10] || null,
      arrival_flight_train_no: params[11] || null,
      departure_date: params[12] || null,
      departure_time: params[13] || null,
      departure_location: params[14] || null,
      departure_flight_train_no: params[15] || null,
      id_card_copy: params[16] || null,
      special_request: params[17] || null,
      call_count: Number(params[18]) || 0,
      call_status: params[19] || "Not Called",
      last_called_at: params[20] || null,
      last_call_summary: params[21] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const idx = store.guests.findIndex((g) => g.id === newGuest.id);
    if (idx >= 0) {
      store.guests[idx] = { ...store.guests[idx], ...newGuest };
    } else {
      store.guests.push(newGuest);
    }
    if (supabase) {
      try {
        await supabase.from("guests").upsert(newGuest);
      } catch (err) {
        console.warn("Supabase guest insert notice:", err.message);
      }
    }
    return formatResult([newGuest]);
  }

  if (lowerSql.startsWith("insert into guest_call_logs")) {
    const newLog = {
      id: params[0],
      guest_id: params[1],
      wedding_id: params[2] || "wedding_01",
      call_number: Number(params[3]) || 1,
      agent_id: params[4] || null,
      agent_name: params[5] || "Call Desk Agent",
      call_outcome: params[6] || "Connected",
      call_summary: params[7] || "",
      callback_date: params[8] || null,
      called_at: new Date().toISOString(),
    };
    store.guest_call_logs.push(newLog);
    if (supabase) {
      try {
        await supabase.from("guest_call_logs").upsert(newLog);
      } catch (err) {
        console.warn("Supabase call log insert notice:", err.message);
      }
    }
    return formatResult([newLog]);
  }

  if (lowerSql.startsWith("insert into wedding_messages")) {
    const newMsg = {
      id: params[0],
      wedding_id: params[1],
      sender_id: params[2],
      sender_name: params[3],
      sender_role: params[4],
      message: params[5],
      is_read: params[6] === true,
      created_at: params[7] || new Date().toISOString(),
    };
    if (!store.messages) store.messages = [];
    const exists = store.messages.some((m) => m.id === newMsg.id);
    if (!exists) {
      store.messages.push(newMsg);
      saveMessagesToFile();
    }
    if (supabase) {
      try {
        await supabase.from("wedding_messages").upsert(newMsg);
      } catch (err) {}
    }
    return formatResult([newMsg]);
  }


  // ============================================================
  // C. UPDATE OPERATIONS
  // ============================================================
  if (lowerSql.startsWith("update weddings")) {
    // 1. Partial update: google_sheet_last_synced update from GoogleSheetsService
    if (lowerSql.includes("google_sheet_last_synced") && (params.length === 1 || !lowerSql.includes("groom_name ="))) {
      const id = params[params.length - 1];
      const idx = store.weddings.findIndex((w) => w.id === id);
      if (idx >= 0) {
        store.weddings[idx].google_sheet_last_synced = new Date().toISOString();
        store.weddings[idx].google_sheet_sync_status = "synced";
        store.weddings[idx].updated_at = new Date().toISOString();
      }
      if (supabase) {
        try {
          await supabase.from("weddings").update({
            google_sheet_last_synced: new Date().toISOString(),
            google_sheet_sync_status: "synced",
            updated_at: new Date().toISOString(),
          }).eq("id", id);
        } catch (err) {
          console.warn("Supabase wedding sync status update notice:", err.message);
        }
      }
      return formatResult(idx >= 0 ? [store.weddings[idx]] : []);
    }

    // 2. Full wedding update
    const id = params[params.length - 1];
    let idx = store.weddings.findIndex((w) => w.id === id);
    if (idx === -1) {
      store.weddings.push({ id, created_at: new Date().toISOString() });
      idx = store.weddings.length - 1;
    }

    const currentWedding = store.weddings[idx] || {};
    // Extra safety: NEVER set groom_name to a wedding_ID!
    let safeGroom = params[0] !== undefined ? params[0] : currentWedding.groom_name;
    if (safeGroom && (String(safeGroom).startsWith("wedding_") || String(safeGroom) === id)) {
      if (currentWedding.groom_name && !String(currentWedding.groom_name).startsWith("wedding_")) {
        safeGroom = currentWedding.groom_name;
      } else if (currentWedding.client_username) {
        const uPart = currentWedding.client_username.split("_")[0]?.replace(/[0-9]/g, "");
        if (uPart) safeGroom = uPart.charAt(0).toUpperCase() + uPart.slice(1);
      }
    }

    store.weddings[idx] = {
      ...currentWedding,
      id,
      groom_name: safeGroom,
      bride_name: params[1] !== undefined ? params[1] : currentWedding.bride_name,
      wedding_date: params[2] !== undefined ? params[2] : currentWedding.wedding_date,
      venue: params[3] !== undefined ? params[3] : currentWedding.venue,
      city: params[4] !== undefined ? params[4] : currentWedding.city,
      cover_theme: params[5] !== undefined ? params[5] : currentWedding.cover_theme,
      notes: params[6] !== undefined ? params[6] : currentWedding.notes,
      client_username: params[7] !== undefined ? params[7] : currentWedding.client_username,
      client_password: params[8] !== undefined ? params[8] : currentWedding.client_password,
      google_sheet_id: params[9] !== undefined ? params[9] : currentWedding.google_sheet_id,
      google_sheet_url: params[10] !== undefined ? params[10] : currentWedding.google_sheet_url,
      google_sheet_sync_status: params[11] !== undefined ? params[11] : currentWedding.google_sheet_sync_status,
      google_sheet_last_synced: params[12] !== undefined ? params[12] : currentWedding.google_sheet_last_synced,
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const supaPayload = { ...store.weddings[idx] };
        delete supaPayload.id;
        delete supaPayload.total_guests;
        delete supaPayload.confirmed_guests;
        delete supaPayload.bride_guests;
        delete supaPayload.groom_guests;
        await supabase.from("weddings").update(supaPayload).eq("id", id);
      } catch (err) {
        console.warn("Supabase wedding update notice:", err.message);
      }
    }
    return formatResult([store.weddings[idx]]);
  }

  if (lowerSql.startsWith("update guests")) {
    const id = params[params.length - 1];
    let idx = store.guests.findIndex((g) => g.id === id);
    if (idx === -1) {
      store.guests.push({ id, created_at: new Date().toISOString() });
      idx = store.guests.length - 1;
    }

    const currentGuest = store.guests[idx] || {};
    const updatedObj = {
      ...currentGuest,
      id,
      updated_at: new Date().toISOString(),
    };

    // 1. FULL GUEST RECORD UPDATE (from GuestModel.update: wedding_id = $1, sr_no = $2, guest_name = $3 ... WHERE id = $22)
    if (lowerSql.includes("wedding_id = $1") || params.length >= 22) {
      if (params[0] !== undefined) updatedObj.wedding_id = params[0];
      if (params[1] !== undefined && params[1] !== "") updatedObj.sr_no = Number(params[1]) || 1;
      if (params[2] !== undefined) updatedObj.guest_name = params[2];
      if (params[3] !== undefined) updatedObj.contact = params[3];
      if (params[4] !== undefined) updatedObj.side = params[4];
      if (params[5] !== undefined) updatedObj.rsvp_status = params[5];
      if (params[6] !== undefined) updatedObj.id_card_received = params[6];
      if (params[7] !== undefined) updatedObj.arrival_date = params[7];
      if (params[8] !== undefined) updatedObj.arrival_time = params[8];
      if (params[9] !== undefined) updatedObj.arrival_location = params[9];
      if (params[10] !== undefined) updatedObj.arrival_flight_train_no = params[10];
      if (params[11] !== undefined) updatedObj.departure_date = params[11];
      if (params[12] !== undefined) updatedObj.departure_time = params[12];
      if (params[13] !== undefined) updatedObj.departure_location = params[13];
      if (params[14] !== undefined) updatedObj.departure_flight_train_no = params[14];
      if (params[15] !== undefined) updatedObj.id_card_copy = params[15];
      if (params[16] !== undefined) updatedObj.special_request = params[16];
      if (params[17] !== undefined && params[17] !== "") updatedObj.call_count = Number(params[17]) || 0;
      if (params[18] !== undefined) updatedObj.call_status = params[18];
      if (params[19] !== undefined) updatedObj.last_called_at = params[19] || null;
      if (params[20] !== undefined) updatedObj.last_call_summary = params[20];
    } else if (lowerSql.includes("last_called_at = $3, last_call_summary = $4")) {
      // 2. Call log delete / sync (CallLogModel.delete: call_count = $1, call_status = $2, last_called_at = $3, last_call_summary = $4 WHERE id = $5)
      if (params[0] !== undefined) updatedObj.call_count = Number(params[0]) || 0;
      if (params[1] !== undefined) updatedObj.call_status = params[1] || "Not Called";
      if (params[2] !== undefined) updatedObj.last_called_at = params[2] || null;
      if (params[3] !== undefined) updatedObj.last_call_summary = params[3] || null;
    } else if (lowerSql.includes("call_count = $1, call_status = $2")) {
      // 3. Call log create (CallLogModel.create: call_count = $1, call_status = $2, last_called_at = NOW(), last_call_summary = $3)
      if (params[0] !== undefined) updatedObj.call_count = Number(params[0]) || 1;
      if (params[1] !== undefined) updatedObj.call_status = params[1] || "Connected";
      updatedObj.last_called_at = new Date().toISOString();
      if (params[2] !== undefined) updatedObj.last_call_summary = params[2] || "";
      let pIdx = 3;
      if (lowerSql.includes("rsvp_status = $")) {
        updatedObj.rsvp_status = params[pIdx++];
      }
      if (lowerSql.includes("special_request = $")) {
        updatedObj.special_request = params[pIdx++];
      }
    } else if (lowerSql.includes("call_status = $1, last_call_summary = $2")) {
      // 4. Call log update (CallLogModel.update: call_status = $1, last_call_summary = $2 WHERE id = $3)
      updatedObj.call_status = params[0] || "Connected";
      updatedObj.last_call_summary = params[1] || "";
      if (!updatedObj.call_count || Number(updatedObj.call_count) === 0) {
        updatedObj.call_count = 1;
      }
    }

    // Safety guard: ensure last_call_summary is NEVER accidentally set to guest_name
    if (
      updatedObj.last_call_summary !== null &&
      updatedObj.last_call_summary !== undefined &&
      updatedObj.guest_name &&
      String(updatedObj.last_call_summary).trim().toLowerCase() === String(updatedObj.guest_name).trim().toLowerCase()
    ) {
      updatedObj.last_call_summary = null;
    }
    if (updatedObj.call_status === "1" || updatedObj.call_status === "2" || (!isNaN(Number(updatedObj.call_status)) && updatedObj.call_status !== "Not Called")) {
      updatedObj.call_status = Number(updatedObj.call_count) > 0 ? "Connected" : "Not Called";
    }

    store.guests[idx] = updatedObj;
    if (supabase) {
      try {
        const supaPayload = { ...updatedObj };
        delete supaPayload.id;
        await supabase.from("guests").update(supaPayload).eq("id", id);
      } catch (err) {
        console.warn("Supabase guest update notice:", err.message);
      }
    }
    return formatResult([updatedObj]);
  }

  if (lowerSql.startsWith("update guest_call_logs")) {
    const id = params[params.length - 1];
    let idx = store.guest_call_logs.findIndex((l) => l.id === id);
    if (idx === -1) {
      store.guest_call_logs.push({ id });
      idx = store.guest_call_logs.length - 1;
    }

    if (params[0] !== undefined) store.guest_call_logs[idx].call_outcome = params[0];
    if (params[1] !== undefined) store.guest_call_logs[idx].call_summary = params[1];
    if (params[2] !== undefined) store.guest_call_logs[idx].callback_date = params[2];
    if (supabase) {
      try {
        const supaLog = { ...store.guest_call_logs[idx] };
        delete supaLog.id;
        await supabase.from("guest_call_logs").update(supaLog).eq("id", id);
      } catch (err) {
        console.warn("Supabase call log update notice:", err.message);
      }
    }
    return formatResult([store.guest_call_logs[idx]]);
  }

  // ============================================================
  // D. SELECT OPERATIONS
  // ============================================================

  // 1. Users Queries
  if (lowerSql.includes("from users")) {
    if (lowerSql.startsWith("select count(*)")) {
      return formatResult([{ count: store.users.length }]);
    }
    if (
      lowerSql.includes("where lower(email) = $1") ||
      lowerSql.includes("lower(name) = $3") ||
      lowerSql.includes("where id = $1")
    ) {
      const p = (params[0] || "").toString().toLowerCase().trim();
      const user = store.users.find(
        (u) =>
          u.id === params[0] ||
          u.email.toLowerCase() === p ||
          u.email.toLowerCase().startsWith(p) ||
          u.name.toLowerCase() === p
      );
      return formatResult(user ? [user] : []);
    }
    const rows = [...store.users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return formatResult(rows);
  }

  // Helper to heal corrupted wedding groom names
  const healWedding = (w) => {
    if (!w) return w;
    let groom = (w.groom_name || "").trim();
    if (!groom || groom.startsWith("wedding_") || groom === w.id) {
      if (w.client_username) {
        const uPart = w.client_username.split("_")[0]?.replace(/[0-9]/g, "");
        if (uPart) groom = uPart.charAt(0).toUpperCase() + uPart.slice(1);
      }
      if (!groom || groom.startsWith("wedding_")) groom = "Groom";
    }
    return { ...w, groom_name: groom };
  };

  // 2. Weddings Queries
  if (lowerSql.includes("from weddings")) {
    if (lowerSql.startsWith("select count(*)")) {
      return formatResult([{ count: store.weddings.length }]);
    }

    // Single wedding by ID or client credentials
    if (lowerSql.includes("where w.id = $1") || lowerSql.includes("where (lower(client_username)")) {
      const idOrUser = (params[0] || "").toString().toLowerCase().trim();
      const wedding = store.weddings.find(
        (w) =>
          w.id === params[0] ||
          (w.client_username && w.client_username.toLowerCase() === idOrUser) ||
          (w.client_username && w.client_username.toLowerCase() === idOrUser.replace("@weddingportal.com", ""))
      );
      if (wedding) {
        const cleanW = healWedding(wedding);
        const weddingGuests = store.guests.filter((g) => g.wedding_id === cleanW.id);
        const enriched = {
          ...cleanW,
          total_guests: weddingGuests.length,
          confirmed_guests: weddingGuests.filter((g) => (g.rsvp_status || "").toLowerCase() === "confirmed").length,
          bride_guests: weddingGuests.filter((g) => (g.side || "").toLowerCase() === "bride").length,
          groom_guests: weddingGuests.filter((g) => (g.side || "").toLowerCase() === "groom").length,
        };
        return formatResult([enriched]);
      }
      return formatResult([]);
    }

    // All weddings with stats
    const rows = store.weddings.map((rawW) => {
      const w = healWedding(rawW);
      const weddingGuests = store.guests.filter((g) => g.wedding_id === w.id);
      return {
        ...w,
        total_guests: weddingGuests.length,
        confirmed_guests: weddingGuests.filter((g) => (g.rsvp_status || "").toLowerCase() === "confirmed").length,
        bride_guests: weddingGuests.filter((g) => (g.side || "").toLowerCase() === "bride").length,
        groom_guests: weddingGuests.filter((g) => (g.side || "").toLowerCase() === "groom").length,
      };
    });
    return formatResult(rows);
  }

  // 3. Guests Queries
  if (lowerSql.includes("from guests")) {
    if (lowerSql.includes("select max(sr_no)")) {
      const weddingId = params[0];
      const weddingGuests = store.guests.filter((g) => !weddingId || g.wedding_id === weddingId);
      const maxSr = weddingGuests.reduce((max, g) => Math.max(max, Number(g.sr_no) || 0), 0);
      return formatResult([{ max_sr: maxSr }]);
    }

    if (lowerSql.includes("select count(*)::int as \"totalguests\"") || lowerSql.includes("sum(case when")) {
      const weddingId = params[0];
      const list = store.guests.filter(
        (g) => !weddingId || weddingId === "all" || weddingId === "All" || g.wedding_id === weddingId
      );
      const totalGuests = list.length;
      const notCalledCount = list.filter((g) => Number(g.call_count || 0) === 0).length;
      const call1Count = list.filter((g) => Number(g.call_count) === 1).length;
      const call2Count = list.filter((g) => Number(g.call_count) === 2).length;
      const call3CompletedCount = list.filter((g) => Number(g.call_count) >= 3).length;
      const connectedCount = list.filter((g) =>
        ["connected", "rsvp confirmed"].includes((g.call_status || "").toLowerCase())
      ).length;
      const callbackCount = list.filter((g) => (g.call_status || "").toLowerCase() === "callback requested").length;

      return formatResult([
        {
          totalGuests,
          notCalledCount,
          call1Count,
          call2Count,
          call3CompletedCount,
          connectedCount,
          callbackCount,
        },
      ]);
    }

    if (lowerSql.includes("where id = $1")) {
      const g = store.guests.find((x) => x.id === params[0]);
      return formatResult(g ? [g] : []);
    }

    // Filter guests
    let list = [...store.guests];
    if (params.length > 0 && lowerSql.includes("wedding_id = $")) {
      const wId = params[0];
      if (wId && wId !== "All" && wId !== "all") {
        list = list.filter((g) => g.wedding_id === wId);
      }
    }
    return formatResult(list);
  }

  // 4. Guest Call Logs Queries
  if (lowerSql.includes("from guest_call_logs")) {
    if (lowerSql.includes("count(*)")) {
      const guestId = params[0];
      const list = guestId ? store.guest_call_logs.filter((c) => c.guest_id === guestId) : store.guest_call_logs;
      return formatResult([{ totalCalls: list.length, totalLoggedAttempts: list.length }]);
    }
    if (lowerSql.includes("where guest_id = $1")) {
      const list = store.guest_call_logs.filter((c) => c.guest_id === params[0]);
      return formatResult(list);
    }
    if (lowerSql.includes("where id = $1")) {
      const c = store.guest_call_logs.find((x) => x.id === params[0]);
      return formatResult(c ? [c] : []);
    }
    return formatResult(store.guest_call_logs);
  }

  // 5. Wedding Messages Queries (Admin & Client Chat)
  if (lowerSql.includes("from wedding_messages")) {
    const rawList = lowerSql.includes("where wedding_id = $1")
      ? (store.messages || []).filter((m) => m.wedding_id === params[0])
      : store.messages || [];
    const seen = new Set();
    const unique = rawList.filter((m) => {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        return true;
      }
      return false;
    });
    return formatResult(unique);
  }

  // Default empty result
  return formatResult([]);
};

// Pool compatible object for model queries
export const pool = {
  query,
  connect: async () => ({
    query,
    release: () => {},
  }),
};

export default pool;
