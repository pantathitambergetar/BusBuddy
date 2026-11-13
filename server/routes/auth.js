/**
 * ==============================================================================
 * BUSBUDDY - ROUTES AUTHENTICATION & LOGIN (routes/auth.js)
 * POST /api/auth/login   → Login terpadu (Siswa, Guru, Developer) langsung ke MySQL
 * ==============================================================================
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Kredensial Developer
const AKUN_DEVELOPER = {
    id: "DEV-001",
    username: "developer",
    nama: "Tim IT Developer BusBuddy SMAN 5",
    jabatan: "Administrator Sistem",
    peran: "developer",
    masterPassword: "smaladev2026",
    noWa: "6281211112222",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60"
};

function generatePasswordFromID(idNumber) {
    const cleanID = (idNumber || '').toString().trim();
    if (cleanID.length < 5) return "smala" + cleanID;
    return "smala" + cleanID.slice(-5);
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
    let { identifier, password } = req.body;
    identifier = (identifier || '').toString().trim();
    password = (password || '').toString().trim();

    if (!identifier || !password) {
        return res.status(400).json({ success: false, message: 'Nomor Identitas dan Password wajib diisi.' });
    }

    // 1. Cek Developer
    if (identifier.toLowerCase() === AKUN_DEVELOPER.username.toLowerCase() || identifier === AKUN_DEVELOPER.id) {
        if (password === AKUN_DEVELOPER.masterPassword) {
            return res.json({
                success: true,
                message: 'Login Developer berhasil!',
                user: { ...AKUN_DEVELOPER }
            });
        } else {
            return res.status(401).json({ success: false, message: 'Kata sandi Developer salah!' });
        }
    }

    // 2. Cek Password Sekolah: "smala" + 5 digit terakhir
    const expectedPassword = generatePasswordFromID(identifier);
    if (password !== expectedPassword) {
        return res.status(401).json({
            success: false,
            message: `Kata sandi tidak sesuai! Format kata sandi adalah "smala" + 5 digit terakhir nomor identitas Anda. Contoh: ${expectedPassword}`
        });
    }

    try {
        // 3. Cek Siswa di Database PostgreSQL
        const [students] = await pool.query('SELECT * FROM siswa WHERE nisn = ?', [identifier]);
        if (students.length > 0) {
            const row = students[0];
            await pool.query("UPDATE siswa SET status = 'online', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [row.id]);
            const user = {
                id:             row.id,
                nisn:           row.nisn,
                nama:           row.nama,
                kelas:          row.kelas,
                absen:          row.absen,
                jenisKelamin:   row.jenis_kelamin,
                peran:          'siswa',
                passwordHash:   row.password_hash,
                lat:            parseFloat(row.lat),
                lng:            parseFloat(row.lng),
                area:           row.area,
                rutePerjalanan: row.rute_perjalanan,
                noWa:           row.no_wa || '',
                status:         'online'
            };
            return res.json({
                success: true,
                message: `Login Berhasil! Selamat datang, ${user.nama} (SISWA).`,
                user: user
            });
        }

        // 4. Cek Guru di Database MySQL
        const [teachers] = await pool.query('SELECT * FROM guru WHERE nip = ?', [identifier]);
        if (teachers.length > 0) {
            const row = teachers[0];
            const user = {
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
            return res.json({
                success: true,
                message: `Login Berhasil! Selamat datang, ${user.nama} (GURU).`,
                user: user
            });
        }

        // 5. Tidak ditemukan di PostgreSQL
        return res.status(404).json({
            success: false,
            code: 'NOT_FOUND',
            message: `Nomor Identitas ${identifier} belum terdaftar di database PostgreSQL BusBuddy.`
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server database.' });
    }
});

module.exports = router;
