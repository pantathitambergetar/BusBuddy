-- ==============================================================================
-- BUSBUDDY SMAN 5 SURABAYA - SKEMA DATABASE PostgreSQL
-- Jalankan file ini untuk membuat struktur tabel di PostgreSQL
-- ==============================================================================

-- ==============================================================================
-- 1. TABEL SISWA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS siswa (
    id              VARCHAR(20)     PRIMARY KEY,
    nisn            VARCHAR(20)     UNIQUE NOT NULL,
    nama            VARCHAR(100)    NOT NULL,
    kelas           VARCHAR(30)     DEFAULT 'X-E 1',
    absen           INT             DEFAULT 1,
    jenis_kelamin   VARCHAR(15)     DEFAULT 'Laki-laki',
    password_hash   VARCHAR(255)    NOT NULL,
    lat             NUMERIC(10,7)   DEFAULT -7.2588000,
    lng             NUMERIC(10,7)   DEFAULT 112.7430000,
    area            VARCHAR(100)    DEFAULT 'Genteng Surabaya',
    rute_perjalanan VARCHAR(200)    DEFAULT 'Kawasan Pusat -> SMAN 5',
    no_wa           VARCHAR(20)     DEFAULT '',
    status          VARCHAR(20)     DEFAULT 'tersedia',
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_siswa_nisn ON siswa (nisn);

-- ==============================================================================
-- 2. TABEL GURU
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
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guru_nip ON guru (nip);

-- ==============================================================================
-- 3. TABEL PERMINTAAN TEBENGAN (RIDE REQUESTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tebengan_requests (
    id              SERIAL          PRIMARY KEY,
    student_id      VARCHAR(20)     UNIQUE NOT NULL,
    student_name    VARCHAR(100)    NOT NULL,
    waktu           VARCHAR(20),
    status          VARCHAR(20)     DEFAULT 'menunggu',
    status_text     VARCHAR(50)     DEFAULT 'Menunggu Konfirmasi',
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requests_student_id ON tebengan_requests (student_id);
