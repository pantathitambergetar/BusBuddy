/**
 * ==============================================================================
 * BUSBUDDY - ROUTES PERMINTAAN TEBENGAN (routes/requests.js)
 * GET  /api/requests         → Semua permintaan
 * POST /api/requests         → Buat permintaan baru
 * DELETE /api/requests/:id   → Hapus permintaan
 * ==============================================================================
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/requests
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tebengan_requests ORDER BY created_at DESC');
        res.json({
            success: true,
            data: rows.map(r => ({
                studentId:   r.student_id,
                studentName: r.student_name,
                waktu:       r.waktu,
                status:      r.status,
                statusText:  r.status_text
            }))
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data.' });
    }
});

// POST /api/requests
router.post('/', async (req, res) => {
    const r = req.body;
    if (!r.studentId || !r.studentName) {
        return res.status(400).json({ success: false, message: 'studentId dan studentName wajib.' });
    }
    try {
        // Upsert: update jika sudah ada, insert jika belum
        await pool.query(`
            INSERT INTO tebengan_requests (student_id, student_name, waktu, status, status_text)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (student_id) DO UPDATE SET waktu = EXCLUDED.waktu, status = 'menunggu', status_text = 'Menunggu Konfirmasi'
        `, [r.studentId, r.studentName, r.waktu, 'menunggu', 'Menunggu Konfirmasi']);
        res.status(201).json({ success: true, message: 'Permintaan tebengan disimpan.' });
    } catch (err) {
        console.error('POST /requests error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal menyimpan permintaan.' });
    }
});

// DELETE /api/requests/:studentId — Hapus permintaan berdasarkan studentId
router.delete('/:studentId', async (req, res) => {
    try {
        await pool.query('DELETE FROM tebengan_requests WHERE student_id = ?', [req.params.studentId]);
        res.json({ success: true, message: 'Permintaan dihapus.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menghapus permintaan.' });
    }
});

module.exports = router;
