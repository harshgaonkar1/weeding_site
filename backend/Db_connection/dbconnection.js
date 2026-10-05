import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "manish_data";

// Pool for database operations
let pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const initDatabase = async () => {
  try {
    // 1. Initial connection without specifying database to create database if not exists
    const rootConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConn.end();

    // 2. Create Users table (Admin & Call Center)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'call_center',
        phone VARCHAR(50) DEFAULT NULL,
        avatar VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Create Weddings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weddings (
        id VARCHAR(64) PRIMARY KEY,
        groom_name VARCHAR(255) NOT NULL,
        bride_name VARCHAR(255) NOT NULL,
        wedding_date VARCHAR(50) DEFAULT NULL,
        venue VARCHAR(255) DEFAULT NULL,
        city VARCHAR(100) DEFAULT NULL,
        cover_theme VARCHAR(50) DEFAULT 'emerald',
        notes TEXT DEFAULT NULL,
        client_username VARCHAR(100) UNIQUE DEFAULT NULL,
        client_password VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_wedding_date (wedding_date),
        INDEX idx_client_username (client_username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Create Guests table with wedding_id, side, and call tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id VARCHAR(64) PRIMARY KEY,
        wedding_id VARCHAR(64) DEFAULT 'wedding_01',
        sr_no INT DEFAULT 1,
        guest_name VARCHAR(255) NOT NULL,
        contact VARCHAR(255) DEFAULT NULL,
        side VARCHAR(50) DEFAULT 'Groom',
        rsvp_status VARCHAR(50) DEFAULT 'Confirmed',
        id_card_received VARCHAR(10) DEFAULT 'No',
        
        -- Arrival Section
        arrival_date VARCHAR(50) DEFAULT NULL,
        arrival_time VARCHAR(50) DEFAULT NULL,
        arrival_location VARCHAR(255) DEFAULT NULL,
        arrival_flight_train_no VARCHAR(100) DEFAULT NULL,
        
        -- Departure Section
        departure_date VARCHAR(50) DEFAULT NULL,
        departure_time VARCHAR(50) DEFAULT NULL,
        departure_location VARCHAR(255) DEFAULT NULL,
        departure_flight_train_no VARCHAR(100) DEFAULT NULL,
        
        -- ID Card & Logistics Documents
        id_card_copy TEXT DEFAULT NULL,
        special_request TEXT DEFAULT NULL,
        
        -- Call Center Tracking & Checkpoints
        call_count INT DEFAULT 0,
        call_status VARCHAR(50) DEFAULT 'Not Called',
        last_called_at TIMESTAMP NULL DEFAULT NULL,
        last_call_summary TEXT DEFAULT NULL,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_wedding_id (wedding_id),
        INDEX idx_guest_name (guest_name),
        INDEX idx_side (side),
        INDEX idx_rsvp_status (rsvp_status),
        INDEX idx_call_status (call_status),
        INDEX idx_call_count (call_count),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Create Guest Call Logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guest_call_logs (
        id VARCHAR(64) PRIMARY KEY,
        guest_id VARCHAR(64) NOT NULL,
        wedding_id VARCHAR(64) DEFAULT 'wedding_01',
        call_number INT NOT NULL DEFAULT 1,
        agent_id VARCHAR(64) DEFAULT NULL,
        agent_name VARCHAR(255) DEFAULT 'Call Desk Agent',
        call_outcome VARCHAR(50) NOT NULL,
        call_summary TEXT NOT NULL,
        callback_date VARCHAR(50) DEFAULT NULL,
        called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_log_guest_id (guest_id),
        INDEX idx_log_wedding_id (wedding_id),
        INDEX idx_called_at (called_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Dynamic schema migration for existing tables
    try {
      // Weddings migration
      const [existingWedCols] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'weddings'`,
        [DB_NAME]
      );
      const wedColNames = existingWedCols.map((c) => c.COLUMN_NAME.toLowerCase());

      if (!wedColNames.includes("client_username")) {
        console.log("🛠️ Migrating: Adding missing 'client_username' column to weddings...");
        await pool.query("ALTER TABLE weddings ADD COLUMN client_username VARCHAR(100) UNIQUE DEFAULT NULL AFTER notes;");
        await pool.query("ALTER TABLE weddings ADD INDEX idx_client_username (client_username);");
      }

      if (!wedColNames.includes("client_password")) {
        console.log("🛠️ Migrating: Adding missing 'client_password' column to weddings...");
        await pool.query("ALTER TABLE weddings ADD COLUMN client_password VARCHAR(255) DEFAULT NULL AFTER client_username;");
      }

      // Backfill default credentials for sample weddings if empty
      await pool.query(`
        UPDATE weddings 
        SET client_username = 'aaditya_ananya', client_password = 'Aaditya@2026' 
        WHERE id = 'wedding_01' AND (client_username IS NULL OR client_username = '');
      `);
      await pool.query(`
        UPDATE weddings 
        SET client_username = 'rohan_priya', client_password = 'Rohan@2026' 
        WHERE id = 'wedding_02' AND (client_username IS NULL OR client_username = '');
      `);
      await pool.query(`
        UPDATE weddings 
        SET client_username = 'aarav_meera', client_password = 'Aarav@2027' 
        WHERE id = 'wedding_03' AND (client_username IS NULL OR client_username = '');
      `);

      // Guest migration
      const [existingGuestCols] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'guests'`,
        [DB_NAME]
      );
      const guestColNames = existingGuestCols.map((c) => c.COLUMN_NAME.toLowerCase());

      if (!guestColNames.includes("wedding_id")) {
        console.log("🛠️ Migrating: Adding missing 'wedding_id' column to guests...");
        await pool.query("ALTER TABLE guests ADD COLUMN wedding_id VARCHAR(64) DEFAULT 'wedding_01' AFTER id;");
        await pool.query("ALTER TABLE guests ADD INDEX idx_wedding_id (wedding_id);");
      }

      if (!guestColNames.includes("side")) {
        console.log("🛠️ Migrating: Adding missing 'side' column to guests...");
        await pool.query("ALTER TABLE guests ADD COLUMN side VARCHAR(50) DEFAULT 'Groom' AFTER contact;");
        await pool.query("ALTER TABLE guests ADD INDEX idx_side (side);");
      }

      if (!guestColNames.includes("call_count")) {
        console.log("🛠️ Migrating: Adding missing 'call_count' column to guests...");
        await pool.query("ALTER TABLE guests ADD COLUMN call_count INT DEFAULT 0 AFTER special_request;");
        await pool.query("ALTER TABLE guests ADD INDEX idx_call_count (call_count);");
      }

      if (!guestColNames.includes("call_status")) {
        console.log("🛠️ Migrating: Adding missing 'call_status' column to guests...");
        await pool.query("ALTER TABLE guests ADD COLUMN call_status VARCHAR(50) DEFAULT 'Not Called' AFTER call_count;");
        await pool.query("ALTER TABLE guests ADD INDEX idx_call_status (call_status);");
      }

      if (!guestColNames.includes("last_called_at")) {
        console.log("🛠️ Migrating: Adding missing 'last_called_at' column to guests...");
        await pool.query("ALTER TABLE guests ADD COLUMN last_called_at TIMESTAMP NULL DEFAULT NULL AFTER call_status;");
      }

      if (!guestColNames.includes("last_call_summary")) {
        console.log("🛠️ Migrating: Adding missing 'last_call_summary' column to guests...");
        await pool.query("ALTER TABLE guests ADD COLUMN last_call_summary TEXT DEFAULT NULL AFTER last_called_at;");
      }

      // Backfill any NULLs in existing records
      await pool.query("UPDATE guests SET wedding_id = 'wedding_01' WHERE wedding_id IS NULL OR wedding_id = '';");
      await pool.query("UPDATE guests SET side = 'Groom' WHERE side IS NULL OR side = '';");
      await pool.query("UPDATE guests SET call_count = 0 WHERE call_count IS NULL;");
      await pool.query("UPDATE guests SET call_status = 'Not Called' WHERE call_status IS NULL OR call_status = '';");
    } catch (migError) {
      console.error("⚠️ Migration check error:", migError.message);
    }

    // 7. Seed or update initial users (Admin & Call Center Agent)
    await pool.query("UPDATE users SET name = 'Manish', password = 'manish1122' WHERE role = 'admin' OR LOWER(email) LIKE '%admin%';");

    const [userRows] = await pool.query("SELECT COUNT(*) as count FROM users");
    if (userRows[0].count === 0) {
      console.log("🌱 Seeding default Admin & Call Center Agent accounts...");
      const sampleUsers = [
        {
          id: "user_admin_01",
          name: "Manish",
          email: "admin@emitly.com",
          password: "manish1122",
          role: "admin",
          phone: "+91 98765 00001",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        },
        {
          id: "user_agent_01",
          name: "Sarah (Call Center Desk)",
          email: "callcenter@emitly.com",
          password: "call123",
          role: "call_center",
          phone: "+91 98765 00002",
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        },
      ];

      for (const u of sampleUsers) {
        await pool.query(
          `INSERT INTO users (id, name, email, password, role, phone, avatar)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [u.id, u.name, u.email, u.password, u.role, u.phone, u.avatar]
        );
      }
    }

    // 8. Seed initial sample weddings if empty
    const [weddingRows] = await pool.query("SELECT COUNT(*) as count FROM weddings");
    if (weddingRows[0].count === 0) {
      console.log("🌱 Seeding initial sample marriage cards...");
      const sampleWeddings = [
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
        },
      ];

      for (const w of sampleWeddings) {
        await pool.query(
          `INSERT INTO weddings (id, groom_name, bride_name, wedding_date, venue, city, cover_theme, notes, client_username, client_password)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [w.id, w.groom_name, w.bride_name, w.wedding_date, w.venue, w.city, w.cover_theme, w.notes, w.client_username, w.client_password]
        );
      }
    }

    // 9. Seed initial guests if empty
    const [guestRows] = await pool.query("SELECT COUNT(*) as count FROM guests");
    if (guestRows[0].count === 0) {
      console.log("🌱 Seeding initial sample guest data...");
      const sampleGuests = [
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
          last_called_at: "2026-09-20 11:30:00",
          last_call_summary: "Confirmed 3-day stay and room requirement. Requested airport cab on arrival.",
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
          last_called_at: "2026-09-22 15:00:00",
          last_call_summary: "Guest confirmed they will reach Terminal 3 on time. Needs hotel shuttle.",
        },
        {
          id: "guest_sophia_01",
          wedding_id: "wedding_02",
          sr_no: 1,
          guest_name: "Sophia Rodriguez",
          contact: "+91 98765 43210",
          side: "Bride",
          rsvp_status: "Pending",
          id_card_received: "No",
          arrival_date: "2026-12-14",
          arrival_time: "01:00 PM",
          arrival_location: "Goa Dabolim Airport (GOI)",
          arrival_flight_train_no: "6E-241",
          departure_date: "2026-12-17",
          departure_time: "11:30 AM",
          departure_location: "Goa Dabolim Airport (GOI)",
          departure_flight_train_no: "6E-244",
          id_card_copy: null,
          special_request: "Sea-facing room preference",
          call_count: 2,
          call_status: "Callback Requested",
          last_called_at: "2026-09-23 10:15:00",
          last_call_summary: "Called 2nd time. Sophia requested a callback on Friday to confirm travel dates.",
        },
      ];

      for (const g of sampleGuests) {
        await pool.query(
          `INSERT INTO guests (
            id, wedding_id, sr_no, guest_name, contact, side, rsvp_status, id_card_received,
            arrival_date, arrival_time, arrival_location, arrival_flight_train_no,
            departure_date, departure_time, departure_location, departure_flight_train_no,
            id_card_copy, special_request, call_count, call_status, last_called_at, last_call_summary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            g.id,
            g.wedding_id,
            g.sr_no,
            g.guest_name,
            g.contact,
            g.side,
            g.rsvp_status,
            g.id_card_received,
            g.arrival_date,
            g.arrival_time,
            g.arrival_location,
            g.arrival_flight_train_no,
            g.departure_date,
            g.departure_time,
            g.departure_location,
            g.departure_flight_train_no,
            g.id_card_copy,
            g.special_request,
            g.call_count || 0,
            g.call_status || "Not Called",
            g.last_called_at || null,
            g.last_call_summary || null,
          ]
        );
      }
    }

    // 10. Seed sample call logs for test guests if empty
    const [callLogRows] = await pool.query("SELECT COUNT(*) as count FROM guest_call_logs");
    if (callLogRows[0].count === 0) {
      console.log("🌱 Seeding sample call logs...");
      const sampleLogs = [
        {
          id: "call_log_01",
          guest_id: "guest_viggnesh_02",
          wedding_id: "wedding_01",
          call_number: 1,
          agent_name: "Sarah (Call Desk)",
          call_outcome: "No Answer",
          call_summary: "Called at 11:00 AM. Phone rang without answer. Scheduled 2nd attempt for tomorrow.",
          called_at: "2026-09-18 11:00:00",
        },
        {
          id: "call_log_02",
          guest_id: "guest_viggnesh_02",
          wedding_id: "wedding_01",
          call_number: 2,
          agent_name: "Sarah (Call Desk)",
          call_outcome: "Connected",
          call_summary: "Spoke with guest. He requested time till evening to verify flight AI-682 tickets.",
          called_at: "2026-09-19 14:30:00",
        },
        {
          id: "call_log_03",
          guest_id: "guest_viggnesh_02",
          wedding_id: "wedding_01",
          call_number: 3,
          agent_name: "Sarah (Call Desk)",
          call_outcome: "RSVP Confirmed",
          call_summary: "3rd call checkpoint complete. Confirmed 3-day stay, vegetarian breakfast, and cab pickup at Mumbai T2.",
          called_at: "2026-09-20 11:30:00",
        },
        {
          id: "call_log_04",
          guest_id: "guest_manish_04",
          wedding_id: "wedding_01",
          call_number: 1,
          agent_name: "Sarah (Call Desk)",
          call_outcome: "Connected",
          call_summary: "1st call checkpoint: Guest confirmed they will reach Terminal 3 on time. Needs hotel shuttle pickup.",
          called_at: "2026-09-22 15:00:00",
        },
      ];

      for (const log of sampleLogs) {
        await pool.query(
          `INSERT INTO guest_call_logs (id, guest_id, wedding_id, call_number, agent_name, call_outcome, call_summary, called_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [log.id, log.guest_id, log.wedding_id, log.call_number, log.agent_name, log.call_outcome, log.call_summary, log.called_at]
        );
      }
    }
  } catch (error) {
    console.error("⚠️ MySQL Database initialization note:", error.message);
    throw error;
  }
};

export const testConnection = async () => {
  try {
    // 1. Ensure database and schema are initialized first
    await initDatabase();
    
    // 2. Test pool connection to the target database
    const connection = await pool.getConnection();
    console.log(`✅ Connected to MySQL database '${DB_NAME}' successfully!`);
    connection.release();
  } catch (error) {
    console.error(`❌ MySQL connection error: ${error.message}`);
    if (error.code === "ECONNREFUSED") {
      console.error(
        `💡 Hint: The MySQL server is not running or not reachable on ${DB_HOST}:${DB_PORT}.\n   Please start the MySQL service with 'sudo systemctl start mysqld'.`
      );
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error(
        `💡 Hint: Access denied for user '${DB_USER}'. Please verify your DB_USER and DB_PASSWORD in backend/.env.`
      );
    }
  }
};

export default pool;
