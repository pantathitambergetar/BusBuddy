-- ==============================================================================
-- BUSBUDDY SMAN 5 SURABAYA - SKEMA DATABASE MySQL
-- Jalankan file ini sekali untuk membuat struktur database
-- Perintah: mysql -u root -p < schema.sql
-- ==============================================================================

-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS busbuddy_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE busbuddy_db;

-- ==============================================================================
-- TABEL SISWA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS siswa (
    id              VARCHAR(20)     PRIMARY KEY,
    nisn            VARCHAR(20)     UNIQUE NOT NULL,
    nama            VARCHAR(100)    NOT NULL,
    kelas           VARCHAR(30)     DEFAULT 'X-E 1',
    absen           INT             DEFAULT 1,
    jenis_kelamin   VARCHAR(15)     DEFAULT 'Laki-laki',
    password_hash   VARCHAR(255)    NOT NULL,
    lat             DECIMAL(10,7)   DEFAULT -7.2588000,
    lng             DECIMAL(10,7)   DEFAULT 112.7430000,
    area            VARCHAR(100)    DEFAULT 'Genteng Surabaya',
    rute_perjalanan VARCHAR(200)    DEFAULT 'Kawasan Pusat -> SMAN 5',
    no_wa           VARCHAR(20)     DEFAULT '',
    status          VARCHAR(20)     DEFAULT 'tersedia',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nisn (nisn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABEL GURU
-- ==============================================================================
CREATE TABLE IF NOT EXISTS guru (
    id              VARCHAR(20)     PRIMARY KEY,
    nip             VARCHAR(30)     UNIQUE NOT NULL,
    nama            VARCHAR(100)    NOT NULL,
    jabatan         VARCHAR(100)    DEFAULT 'Guru SMAN 5 Surabaya',
    jenis_kelamin   VARCHAR(15)     DEFAULT 'Laki-laki',
    password_hash   VARCHAR(255)    NOT NULL,
    no_wa           VARCHAR(20)     DEFAULT '',
    area            VARCHAR(100)    DEFAULT 'Ruang Guru SMAN 5 Surabaya',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nip (nip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABEL PERMINTAAN TEBENGAN (RIDE REQUESTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tebengan_requests (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    student_id      VARCHAR(20)     UNIQUE NOT NULL,
    student_name    VARCHAR(100)    NOT NULL,
    waktu           VARCHAR(20),
    status          VARCHAR(20)     DEFAULT 'menunggu',
    status_text     VARCHAR(50)     DEFAULT 'Menunggu Konfirmasi',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- Verifikasi
-- ==============================================================================
SELECT 
    TABLE_NAME AS 'Tabel',
    TABLE_ROWS AS 'Perkiraan Baris',
    CREATE_TIME AS 'Dibuat'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'busbuddy_db';

SELECT 'Database busbuddy_db berhasil dibuat! Silakan jalankan server.' AS Status;
