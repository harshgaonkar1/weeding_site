-- =========================================================
-- Emitly Database Schema for MySQL
-- Database: manish_data
-- Multi-Wedding, Guest Logistics & Call Center System
-- =========================================================

-- 1. Create database if it does not exist
CREATE DATABASE IF NOT EXISTS manish_data 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE manish_data;

-- 2. System Users (Admin & Call Center Telecallers)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'call_center', -- 'admin' or 'call_center'
  phone VARCHAR(50) DEFAULT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Weddings / Marriage Events Table
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
  google_sheet_id VARCHAR(255) DEFAULT NULL,
  google_sheet_url VARCHAR(500) DEFAULT NULL,
  google_sheet_sync_status VARCHAR(50) DEFAULT 'connected',
  google_sheet_last_synced TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_wedding_date (wedding_date),
  INDEX idx_client_username (client_username),
  INDEX idx_google_sheet_id (google_sheet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Guests & Logistics Table
CREATE TABLE IF NOT EXISTS guests (
  id VARCHAR(64) PRIMARY KEY,
  wedding_id VARCHAR(64) DEFAULT 'wedding_01',
  sr_no INT DEFAULT 1,
  guest_name VARCHAR(255) NOT NULL,
  contact VARCHAR(255) DEFAULT NULL,
  side VARCHAR(50) DEFAULT 'Groom', -- 'Bride', 'Groom', or 'Both'
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
  call_count INT DEFAULT 0, -- 0, 1, 2, 3+ call checkpoints
  call_status VARCHAR(50) DEFAULT 'Not Called', -- 'Not Called', 'Connected', 'No Answer', 'Busy', 'Callback Requested', 'RSVP Confirmed'
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

-- 5. Call Center Detailed Logs & Summary History
CREATE TABLE IF NOT EXISTS guest_call_logs (
  id VARCHAR(64) PRIMARY KEY,
  guest_id VARCHAR(64) NOT NULL,
  wedding_id VARCHAR(64) DEFAULT 'wedding_01',
  call_number INT NOT NULL DEFAULT 1, -- 1st call, 2nd call, 3rd call
  agent_id VARCHAR(64) DEFAULT NULL,
  agent_name VARCHAR(255) DEFAULT 'Call Desk Agent',
  call_outcome VARCHAR(50) NOT NULL, -- 'Connected', 'No Answer', 'Busy', 'Callback Scheduled', 'RSVP Confirmed', 'Wrong Number'
  call_summary TEXT NOT NULL, -- Important discussion points, diet/travel notes, remarks
  callback_date VARCHAR(50) DEFAULT NULL,
  called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_log_guest_id (guest_id),
  INDEX idx_log_wedding_id (wedding_id),
  INDEX idx_called_at (called_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
