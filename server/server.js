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

// Izinkan request dari frontend (file HTML dibuka via Live Server / langsung)
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:5500').split(',');
app.use(cors({
    origin: (origin, callback) => {
        // Izinkan request tanpa origin (file:// atau Postman) dan origin yang terdaftar
        if (!origin || allowedOrigins.includes(origin.trim())) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Origin '${origin}' tidak diizinkan.`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON body
app.use(express.json({ limit: '1mb' }));

// Sajikan file statis frontend (HTML, CSS, JS) langsung dari root folder BusBuddy
const path = require('path');
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

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
