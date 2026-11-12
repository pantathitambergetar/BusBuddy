/**
 * ==============================================================================
 * BUSBUDDY - ROUTES MIGRASI DATA (routes/migrate.js)
 * POST /api/migrate/import   → Mengimpor dan menyinkronkan seluruh data ke MySQL
 * ==============================================================================
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.post('/import', async (req, res) => {
    const { students = [], teachers = [], requests = [] } = req.body;

    let studentsImported = 0;
    let teachersImported = 0;
    let requestsImported = 0;

    try {
        // 1. Migrasi Siswa
        for (const s of students) {
            if (!s.nisn || !s.nama) continue;
            await pool.query(`
                INSERT INTO siswa 
                (id, nisn, nama, kelas, absen, jenis_kelamin, password_hash,
                 lat, lng, area, rute_perjalanan, no_wa, status)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE 
                    nama=VALUES(nama), kelas=VALUES(kelas), lat=VALUES(lat), lng=VALUES(lng);
            `, [
                s.id || `SISWA-${Date.now()}`, s.nisn, s.nama, s.kelas || 'X-E 1', s.absen || 1,
                s.jenisKelamin || 'Laki-laki', s.passwordHash || 'migrated',
                s.lat || -7.2588, s.lng || 112.7430, s.area || 'Genteng Surabaya',
                s.rutePerjalanan || 'Kawasan Pusat -> SMAN 5', s.noWa || '',
                s.status || 'tersedia'
            ]);
            studentsImported++;
        }

        // 2. Migrasi Guru
        for (const g of teachers) {
            if (!g.nip || !g.nama) continue;
            await pool.query(`
                INSERT INTO guru
                (id, nip, nama, jabatan, jenis_kelamin, password_hash, no_wa, area)
                VALUES (?,?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE 
                    nama=VALUES(nama), jabatan=VALUES(jabatan);
            `, [
                g.id || `GURU-${Date.now()}`, g.nip, g.nama, g.jabatan || 'Guru SMAN 5 Surabaya',
                g.jenisKelamin || 'Laki-laki', g.passwordHash || 'migrated',
                g.noWa || '', g.area || 'Ruang Guru SMAN 5 Surabaya'
            ]);
            teachersImported++;
        }

        // 3. Migrasi Requests
        for (const r of requests) {
            if (!r.studentId || !r.studentName) continue;
            await pool.query(`
                INSERT INTO tebengan_requests (student_id, student_name, waktu, status, status_text)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE waktu = VALUES(waktu);
            `, [r.studentId, r.studentName, r.waktu || '06:15 WIB', r.status || 'menunggu', r.statusText || 'Menunggu Konfirmasi']);
            requestsImported++;
        }

        res.json({
            success: true,
            message: `Migrasi ke MySQL berhasil: ${studentsImported} Siswa, ${teachersImported} Guru, ${requestsImported} Permintaan.`,
            migrated: { studentsImported, teachersImported, requestsImported }
        });

    } catch (err) {
        console.error('Migrate import error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal melakukan migrasi data: ' + err.message });
    }
});

module.exports = router;
