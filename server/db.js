/**
 * ==============================================================================
 * BUSBUDDY - KONEKSI DATABASE PostgreSQL (db.js)
 * ==============================================================================
 */
const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    }
    : {
        host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.PGPORT || process.env.DB_PORT) || 5432,
        user: process.env.PGUSER || process.env.DB_USER || 'postgres',
        password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.PGDATABASE || process.env.DB_NAME || 'busbuddy_db',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

const rawPool = new Pool(poolConfig);

// Helper query yang menerjemahkan ? -> $1, $2 dan destructuring [rows, res]
async function query(sql, params = []) {
    let paramIdx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIdx++}`);
    const res = await rawPool.query(pgSql, params);

    // Jika ini query SELECT: elemen pertama adalah array rows
    // Jika query UPDATE/DELETE/INSERT: elemen pertama adalah object result dengan affectedRows
    const isSelect = /^\s*SELECT/i.test(pgSql);
    const primary = isSelect ? res.rows : { affectedRows: res.rowCount, rowCount: res.rowCount, rows: res.rows };

    const tuple = [primary, res];
    tuple.rows = res.rows;
    tuple.rowCount = res.rowCount;
    tuple.affectedRows = res.rowCount;
    return tuple;
}

const pool = {
    query,
    connect: () => rawPool.connect(),
    end: () => rawPool.end(),
    rawPool
};

// Tes koneksi saat startup
async function testConnection() {
    try {
        const client = await rawPool.connect();
        const dbInfo = process.env.DATABASE_URL 
            ? 'Cloud PostgreSQL (Supabase)' 
            : `${poolConfig.database}@${poolConfig.host}:${poolConfig.port}`;
        console.log('✅ Koneksi PostgreSQL berhasil! Database:', dbInfo);
        client.release();
    } catch (err) {
        console.error('❌ Koneksi PostgreSQL GAGAL:', err.message);
        console.error('   Pastikan PostgreSQL berjalan dan variabel .env atau DATABASE_URL sudah dikonfigurasi.');
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
}

module.exports = { pool, testConnection };
