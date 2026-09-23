-- ============================================================
-- VeriCure — full database schema
-- ============================================================
--
-- This is the consolidated, current schema — it already
-- includes the guest-scan (nullable user_id) and Report
-- Medicine (medicine_reports, was call_requests) changes made
-- during development, so running this file top-to-bottom on an
-- empty MySQL server gives you a fully working, up-to-date
-- database in one step. It replaces the old vericure_db.sql,
-- which still had the pre-migration schema and — unsafely —
-- had ad-hoc TRUNCATE/debug statements mixed into the setup
-- script itself.
-- ============================================================

CREATE DATABASE IF NOT EXISTS vericure_db;
USE vericure_db;

-- ------------------------------------------------------------
-- 1. Users (registered mobile app accounts)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. OTP verification (used for both user and admin flows)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS otp_verification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(4) NOT NULL,
    expiry_time DATETIME NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3. Verification scans
--    user_id is NULLABLE: a null user_id means a guest scan,
--    saved anonymously for admin dashboard/Detections
--    visibility only — never tied to any account.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS verification_scans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NULL,

    medicine_name VARCHAR(200) NOT NULL,

    -- GENUINE / COUNTERFEIT / UNKNOWN
    result VARCHAR(20) NOT NULL,

    front_status VARCHAR(20),
    front_confidence DOUBLE,

    back_status VARCHAR(20),
    back_confidence DOUBLE,

    extracted_details TEXT,
    manufacturer VARCHAR(255),
    dosage VARCHAR(255),
    batch_number VARCHAR(100),
    expiry_date VARCHAR(50),
    category VARCHAR(255),
    description TEXT,

    latitude DOUBLE NULL,
    longitude DOUBLE NULL,
    location_address VARCHAR(500) NULL,

    scanned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_verification_scans_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_verification_scans_user_id
    ON verification_scans(user_id);

-- ------------------------------------------------------------
-- 4. Admins
--    role:   HEAD_ADMIN | ADMIN
--    status: PENDING | APPROVED | REJECTED
--
--    A brand-new admins table has no HEAD_ADMIN to approve the
--    very first signup, so the backend exposes a one-time
--    POST /api/admin/bootstrap/* endpoint that only works while
--    this table is completely empty — no manual SQL insert
--    (and no hand-crafted bcrypt hash) needed here.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    approved_by BIGINT NULL,
    approved_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_admin_approved_by
        FOREIGN KEY (approved_by) REFERENCES admins(id)
);

CREATE INDEX idx_admins_status ON admins(status);

-- ------------------------------------------------------------
-- 5. Medicine reports (was call_requests)
--    reporter_email is nullable — guests can submit a report
--    too and have no account to attach it to.
--    contact_phone is optional — this is reporting a medicine,
--    not requesting a callback, so no phone is required.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS medicine_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    reporter_email VARCHAR(150) NULL,

    medicine_name VARCHAR(200) NULL,
    category VARCHAR(50) NULL,
    batch_number VARCHAR(100) NULL,
    description TEXT NULL,
    contact_phone VARCHAR(50) NULL,

    -- PENDING, IN_PROGRESS, or RESOLVED
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    admin_note TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_medicine_reports_status ON medicine_reports(status);