/**
 * ==============================================================================
 * BUSBUDDY - ROUTES PERSETUJUAN NEBENG VIA WHATSAPP (routes/nebeng.js)
 * POST /api/nebeng           → Buat permintaan nebeng baru (status: pending)
 * GET  /api/nebeng/:id       → Ambil detail permintaan nebeng untuk persetujuan
 * PUT  /api/nebeng/:id/status → Update status (approved, rejected, finished)
 * GET  /api/nebeng/active    → Ambil nebeng aktif user (peminta / pemberi)
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const WhatsappTemplates = require('../../lib/whatsappTemplates');

// Helper memastikan tabel nebeng ada di database PostgreSQL (dieksekusi maksimal 1x per instance)
let nebengTableChecked = false;
async function ensureNebengTableExists() {
    if (nebengTableChecked) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS nebeng (
                id              SERIAL          PRIMARY KEY,
                peminta_nama    VARCHAR(100)    NOT NULL,
                peminta_wa      VARCHAR(25)     NOT NULL,
                pemberi_nama    VARCHAR(100)    NOT NULL,
                pemberi_wa      VARCHAR(25)     NOT NULL,
                titik_jemput    VARCHAR(255)    DEFAULT 'Kawasan SMAN 5 Surabaya',
                jam_berangkat   VARCHAR(50)     DEFAULT '06:30 WIB',
                status          VARCHAR(20)     DEFAULT 'pending',
                created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_nebeng_peminta_wa ON nebeng (peminta_wa);
            CREATE INDEX IF NOT EXISTS idx_nebeng_pemberi_wa ON nebeng (pemberi_wa);
            CREATE INDEX IF NOT EXISTS idx_nebeng_status ON nebeng (status);
        `);
        nebengTableChecked = true;
    } catch (e) {
        console.error('Error creating nebeng table:', e.message);
    }
}

// 1. POST /api/nebeng — Buat permintaan nebeng baru (status: pending)
router.post('/', async (req, res) => {
    await ensureNebengTableExists();
    const { peminta_nama, peminta_wa, pemberi_nama, pemberi_wa, titik_jemput, jam_berangkat } = req.body || {};

    if (!peminta_nama || !peminta_wa || !pemberi_nama || !pemberi_wa) {
        return res.status(400).json({
            success: false,
            message: 'Nama dan nomor WhatsApp peminta serta pemberi wajib diisi.'
        });
    }

    const cleanPemintaWa = WhatsappTemplates.formatWaNumber(peminta_wa);
    const cleanPemberiWa = WhatsappTemplates.formatWaNumber(pemberi_wa);
    const safeTitik = (titik_jemput || 'Kawasan SMAN 5 Surabaya').trim();
    const safeJam = (jam_berangkat || '06:30 WIB').trim();

    try {
        const sql = `
            INSERT INTO nebeng 
            (peminta_nama, peminta_wa, pemberi_nama, pemberi_wa, titik_jemput, jam_berangkat, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
            RETURNING id, peminta_nama, peminta_wa, pemberi_nama, pemberi_wa, titik_jemput, jam_berangkat, status, created_at
        `;
        const [rows] = await pool.query(sql, [
            peminta_nama.trim(),
            cleanPemintaWa,
            pemberi_nama.trim(),
            cleanPemberiWa,
            safeTitik,
            safeJam
        ]);

        const created = (rows && rows.length > 0) ? rows[0] : null;
        res.status(201).json({
            success: true,
            message: 'Permintaan nebeng berhasil dibuat.',
            data: created
        });
    } catch (err) {
        console.error('POST /api/nebeng error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal membuat permintaan nebeng: ' + err.message });
    }
});

// 2. GET /api/nebeng/active — Ambil nebeng aktif user (pending / approved)
router.get('/active', async (req, res) => {
    await ensureNebengTableExists();
    const wa = WhatsappTemplates.formatWaNumber(req.query.wa || '');
    const nama = (req.query.nama || '').trim();

    if (!wa && !nama) {
        return res.status(400).json({ success: false, message: 'Parameter wa atau nama diperlukan.' });
    }

    try {
        let sql = `
            SELECT id, peminta_nama, peminta_wa, pemberi_nama, pemberi_wa, titik_jemput, jam_berangkat, status, created_at, updated_at
            FROM nebeng
            WHERE status IN ('pending', 'approved')
        `;
        const params = [];
        if (wa && nama) {
            sql += ` AND (peminta_wa = ? OR pemberi_wa = ? OR peminta_nama ILIKE ? OR pemberi_nama ILIKE ?)`;
            params.push(wa, wa, nama, nama);
        } else if (wa) {
            sql += ` AND (peminta_wa = ? OR pemberi_wa = ?)`;
            params.push(wa, wa);
        } else {
            sql += ` AND (peminta_nama ILIKE ? OR pemberi_nama ILIKE ?)`;
            params.push(nama, nama);
        }
        sql += ` ORDER BY id DESC LIMIT 1`;

        const [rows] = await pool.query(sql, params);
        res.json({
            success: true,
            data: (rows && rows.length > 0) ? rows[0] : null
        });
    } catch (err) {
        console.error('GET /api/nebeng/active error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal mengecek nebeng aktif: ' + err.message });
    }
});

// 3. GET /api/nebeng/:id — Detail nebeng untuk halaman persetujuan /nebeng/:id
router.get('/:id', async (req, res) => {
    await ensureNebengTableExists();
    const id = parseInt(req.params.id, 10);
    if (!id) {
        return res.status(400).json({ success: false, message: 'ID nebeng tidak valid.' });
    }

    try {
        const sql = `
            SELECT id, peminta_nama, peminta_wa, pemberi_nama, pemberi_wa, titik_jemput, jam_berangkat, status, created_at, updated_at
            FROM nebeng
            WHERE id = ?
        `;
        const [rows] = await pool.query(sql, [id]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Data nebeng tidak ditemukan.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('GET /api/nebeng/:id error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil detail nebeng: ' + err.message });
    }
});

// 4. PUT /api/nebeng/:id/status — Update status (approved, rejected, finished)
//    Verifikasi: caller_wa harus cocok dengan peminta_wa atau pemberi_wa
router.put('/:id/status', async (req, res) => {
    await ensureNebengTableExists();
    const id = parseInt(req.params.id, 10);
    const { status, caller_wa } = req.body || {};

    const validStatuses = ['pending', 'approved', 'rejected', 'finished'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Status tidak valid. Harus salah satu dari: ${validStatuses.join(', ')}`
        });
    }

    try {
        // Verifikasi caller adalah pihak yang terlibat
        const [existing] = await pool.query('SELECT peminta_wa, pemberi_wa FROM nebeng WHERE id = ?', [id]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Data nebeng tidak ditemukan.' });
        }
        if (caller_wa) {
            const cleanCaller = WhatsappTemplates.formatWaNumber(caller_wa);
            if (cleanCaller !== existing[0].peminta_wa && cleanCaller !== existing[0].pemberi_wa) {
                return res.status(403).json({ success: false, message: 'Akses ditolak: Anda bukan pihak dalam nebeng ini.' });
            }
        }

        const sql = `
            UPDATE nebeng
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            RETURNING id, peminta_nama, peminta_wa, pemberi_nama, pemberi_wa, titik_jemput, jam_berangkat, status, updated_at
        `;
        const [rows] = await pool.query(sql, [status, id]);
        res.json({
            success: true,
            message: `Status nebeng berhasil diubah menjadi '${status}'.`,
            data: rows[0]
        });
    } catch (err) {
        console.error('PUT /api/nebeng/:id/status error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal memperbarui status nebeng: ' + err.message });
    }
});

module.exports = router;
