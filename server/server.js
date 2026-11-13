/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - SERVER API UTAMA (server.js)
 * ==============================================================================
 * Jalankan dengan: node server.js  atau  npm start
 * Port default    : 3000
 * ==============================================================================
 */

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const { testConnection } = require('./db');

const studentsRouter = require('./routes/students');
const teachersRouter = require('./routes/teachers');
const requestsRouter = require('./routes/requests');
const authRouter     = require('./routes/auth');
const migrateRouter  = require('./routes/migrate');

const app  = express();
const PORT = process.env.SERVER_PORT || 3000;

// ==============================================================================
// MIDDLEWARE
// ==============================================================================

// Izinkan request dari frontend (semua origin termasuk Vercel, localhost, mobile, dll)
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Parse JSON body
app.use(express.json({ limit: '1mb' }));

// Auto-inisialisasi tabel PostgreSQL saat pertama kali request API masuk
let dbInitialized = false;
async function ensureTablesExist() {
    if (dbInitialized) return;
    try {
        const { pool } = require('./db');
        await pool.query(`
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
        `);
        dbInitialized = true;
        console.log('✅ Skema tabel database BusBuddy terverifikasi.');
    } catch (err) {
        console.error('⚠️ Gagal auto-init tabel:', err.message);
    }
}

app.use(async (req, res, next) => {
    if (!dbInitialized && req.path.startsWith('/api')) {
        await ensureTablesExist();
    }
    next();
});

// Sajikan file statis frontend (HTML, CSS, JS) langsung dari root folder BusBuddy
const path = require('path');
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(rootDir, 'style.css'));
});
app.use('/js', express.static(path.join(rootDir, 'js')));

// ==============================================================================
// RATE LIMITER: Anti-DDoS & Perlindungan Brute-Force
// ==============================================================================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 menit
    max: 200,                   // Maks 200 request per IP per 15 menit
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Terlalu banyak request. Coba lagi dalam 15 menit.' }
});
app.use('/api', apiLimiter);

// ==============================================================================
// ROUTES
// ==============================================================================
app.use('/api/auth',     authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/migrate',  migrateRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'BusBuddy API Server aktif!',
        time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        version: '2.0'
    });
});

// 404 handler untuk route yang tidak dikenal
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Endpoint '${req.path}' tidak ditemukan.` });
});

// Error handler global
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
});

// ==============================================================================
// STARTUP
// ==============================================================================
async function startServer() {
    console.log('\n🚌 BusBuddy SMAN 5 Surabaya - API Server');
    console.log('==========================================');
    
    // Tes koneksi database sebelum buka port
    await testConnection();

    app.listen(PORT, () => {
        console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
        console.log(`📡 Endpoint tersedia:`);
        console.log(`   GET  /api/health`);
        console.log(`   GET  /api/students`);
        console.log(`   POST /api/students`);
        console.log(`   GET  /api/teachers`);
        console.log(`   POST /api/teachers`);
        console.log(`   GET  /api/requests`);
        console.log(`   POST /api/requests`);
        console.log('==========================================\n');
    });
}

if (!process.env.VERCEL) {
    startServer();
}

module.exports = app;
