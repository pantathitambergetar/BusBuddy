/**
 * ==============================================================================
 * BUSBUDDY - KONEKSI DATABASE MySQL (db.js)
 * ==============================================================================
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// Buat connection pool (lebih efisien dari single connection)
const pool = mysql.createPool({
    host:               process.env.DB_HOST     || 'localhost',
    port:               parseInt(process.env.DB_PORT) || 3306,
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'busbuddy_db',
    waitForConnections: true,
    connectionLimit:    10,       // Maksimum 10 koneksi paralel
    queueLimit:         0,
    charset:            'utf8mb4'
});

// Tes koneksi saat startup
async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log('✅ Koneksi MySQL berhasil! Database:', process.env.DB_NAME || 'busbuddy_db');
        conn.release();
    } catch (err) {
        console.error('❌ Koneksi MySQL GAGAL:', err.message);
        console.error('   Pastikan MySQL berjalan dan .env sudah dikonfigurasi dengan benar.');
        process.exit(1); // Hentikan server jika DB tidak terhubung
    }
}

module.exports = { pool, testConnection };
