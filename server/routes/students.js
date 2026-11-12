/**
 * ==============================================================================
 * BUSBUDDY - ROUTES SISWA (routes/students.js)
 * GET    /api/students         → Semua siswa
 * GET    /api/students/:nisn   → Siswa berdasarkan NISN
 * POST   /api/students         → Tambah siswa baru
 * PUT    /api/students/:id     → Update data siswa
 * DELETE /api/students/:id     → Hapus siswa
 * ==============================================================================
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Helper: konversi row MySQL → objek siswa format frontend
function rowToStudent(row) {
    return {
        id:             row.id,
        nisn:           row.nisn,
        nama:           row.nama,
        kelas:          row.kelas,
        absen:          row.absen,
        jenisKelamin:   row.jenis_kelamin,
        passwordHash:   row.password_hash,
        lat:            parseFloat(row.lat),
        lng:            parseFloat(row.lng),
        area:           row.area,
        rutePerjalanan: row.rute_perjalanan,
        noWa:           row.no_wa || '',
        status:         row.status
    };
}

// GET /api/students — Ambil semua siswa
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM siswa ORDER BY absen ASC, created_at DESC');
        res.json({ success: true, data: rows.map(rowToStudent) });
    } catch (err) {
        console.error('GET /students error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil data siswa.' });
    }
});

// POST /api/students/import-sheet — Impor 32 siswa kelas XII-1 dari Google Sheets / JSON ke MySQL
router.post('/import-sheet', async (req, res) => {
    try {
        const path = require('path');
        const fs = require('fs');
        const jsonPath = path.join(__dirname, '../students_xii_1.json');
        if (!fs.existsSync(jsonPath)) {
            return res.status(404).json({ success: false, message: 'File students_xii_1.json tidak ditemukan.' });
        }
        const students = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        for (const s of students) {
            await pool.query(`
                INSERT INTO siswa 
                (id, nisn, nama, kelas, absen, jenis_kelamin, password_hash,
                 lat, lng, area, rute_perjalanan, no_wa, status)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE 
                    nama=VALUES(nama), kelas=VALUES(kelas), absen=VALUES(absen),
                    lat=VALUES(lat), lng=VALUES(lng), area=VALUES(area), rute_perjalanan=VALUES(rute_perjalanan);
            `, [
                s.id, s.nisn, s.nama, s.kelas, s.absen,
                s.jenisKelamin, s.passwordHash,
                s.lat, s.lng, s.area, s.rutePerjalanan,
                s.noWa || '', s.status || 'tersedia'
            ]);
        }

        res.json({
            success: true,
            message: `Berhasil mengimpor ${students.length} data siswa kelas XII-1 ke database MySQL!`,
            data: students
        });
    } catch (err) {
        console.error('Import sheet error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal mengimpor ke MySQL: ' + err.message });
    }
});

// GET /api/students/:nisn — Ambil satu siswa berdasarkan NISN
router.get('/:nisn', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM siswa WHERE nisn = ?', [req.params.nisn]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan.' });
        }
        res.json({ success: true, data: rowToStudent(rows[0]) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error server.' });
    }
});

// POST /api/students — Tambah siswa baru (dari form daftar atau developer)
router.post('/', async (req, res) => {
    const s = req.body;

    if (!s.nisn || !s.nama || !s.passwordHash) {
        return res.status(400).json({ success: false, message: 'NISN, nama, dan passwordHash wajib diisi.' });
    }

    try {
        // Cek duplikasi NISN
        const [existing] = await pool.query('SELECT id FROM siswa WHERE nisn = ?', [s.nisn]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: `NISN ${s.nisn} sudah terdaftar.` });
        }

        const sql = `
            INSERT INTO siswa 
            (id, nisn, nama, kelas, absen, jenis_kelamin, password_hash,
             lat, lng, area, rute_perjalanan, no_wa, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;
        const vals = [
            s.id, s.nisn, s.nama, s.kelas || 'X-E 1', s.absen || 1,
            s.jenisKelamin || 'Laki-laki', s.passwordHash,
            s.lat || -7.2588, s.lng || 112.7430, s.area || 'Genteng Surabaya',
            s.rutePerjalanan || 'Kawasan Pusat -> SMAN 5', s.noWa || '',
            s.status || 'tersedia'
        ];
        await pool.query(sql, vals);
        res.status(201).json({ success: true, message: 'Siswa berhasil ditambahkan.', data: s });
    } catch (err) {
        console.error('POST /students error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal menyimpan data siswa.' });
    }
});

// PUT /api/students/:id — Update data siswa (misal: update koordinat GPS, dll)
router.put('/:id', async (req, res) => {
    const s = req.body;
    try {
        const sql = `
            UPDATE siswa SET
                nama = COALESCE(?, nama),
                kelas = COALESCE(?, kelas),
                lat = COALESCE(?, lat),
                lng = COALESCE(?, lng),
                area = COALESCE(?, area),
                no_wa = COALESCE(?, no_wa),
                status = COALESCE(?, status)
            WHERE id = ?
        `;
        const vals = [
            s.nama, s.kelas, s.lat, s.lng, s.area, s.noWa, s.status,
            req.params.id
        ];
        const [result] = await pool.query(sql, vals);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan.' });
        }
        res.json({ success: true, message: 'Data siswa berhasil diperbarui.' });
    } catch (err) {
        console.error('PUT /students error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal memperbarui data siswa.' });
    }
});

// DELETE /api/students/:id — Hapus siswa (oleh developer)
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM siswa WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan.' });
        }
        res.json({ success: true, message: 'Siswa berhasil dihapus.' });
    } catch (err) {
        console.error('DELETE /students error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal menghapus siswa.' });
    }
});

module.exports = router;
