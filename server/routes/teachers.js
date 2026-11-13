/**
 * ==============================================================================
 * BUSBUDDY - ROUTES GURU (routes/teachers.js)
 * GET    /api/teachers         → Semua guru
 * POST   /api/teachers         → Tambah guru baru
 * DELETE /api/teachers/:id     → Hapus guru
 * ==============================================================================
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

function rowToTeacher(row) {
    return {
        id:           row.id,
        nip:          row.nip,
        nama:         row.nama,
        jabatan:      row.jabatan,
        jenisKelamin: row.jenis_kelamin,
        peran:        'guru',
        passwordHash: row.password_hash,
        noWa:         row.no_wa || '',
        area:         row.area
    };
}

// GET /api/teachers
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM guru ORDER BY created_at DESC');
        res.json({ success: true, data: rows.map(rowToTeacher) });
    } catch (err) {
        console.error('GET /teachers error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil data guru.' });
    }
});

// POST /api/teachers
router.post('/', async (req, res) => {
    const g = req.body;

    if (!g.nip || !g.nama || !g.passwordHash) {
        return res.status(400).json({ success: false, message: 'NIP, nama, dan passwordHash wajib diisi.' });
    }

    try {
        const [existing] = await pool.query('SELECT id FROM guru WHERE nip = ?', [g.nip]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: `NIP ${g.nip} sudah terdaftar.` });
        }

        // Pastikan ID guru unik agar tidak bentrok primary key
        let teacherId = g.id;
        if (!teacherId || teacherId.startsWith('GURU-00')) {
            teacherId = `GURU-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;
        } else {
            const [existingId] = await pool.query('SELECT id FROM guru WHERE id = ?', [teacherId]);
            if (existingId.length > 0) {
                teacherId = `GURU-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;
            }
        }

        const sql = `
            INSERT INTO guru
            (id, nip, nama, jabatan, jenis_kelamin, password_hash, no_wa, area)
            VALUES (?,?,?,?,?,?,?,?)
        `;
        const vals = [
            teacherId, g.nip, g.nama, g.jabatan || 'Guru SMAN 5 Surabaya',
            g.jenisKelamin || 'Laki-laki', g.passwordHash,
            g.noWa || '', g.area || 'Ruang Guru SMAN 5 Surabaya'
        ];
        await pool.query(sql, vals);
        const createdTeacher = { ...g, id: teacherId };
        res.status(201).json({ success: true, message: 'Guru berhasil ditambahkan.', data: createdTeacher });
    } catch (err) {
        console.error('POST /teachers error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal menyimpan data guru: ' + err.message });
    }
});

// DELETE /api/teachers/:id
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM guru WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Guru tidak ditemukan.' });
        }
        res.json({ success: true, message: 'Guru berhasil dihapus.' });
    } catch (err) {
        console.error('DELETE /teachers error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal menghapus guru.' });
    }
});

module.exports = router;
