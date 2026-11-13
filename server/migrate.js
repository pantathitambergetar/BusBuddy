/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - SKRIP MIGRASI DATABASE PostgreSQL (migrate.js)
 * ==============================================================================
 * Skrip otomatis ini akan:
 * 1. Menghubungkan ke PostgreSQL (lokal atau cloud via DATABASE_URL)
 * 2. Membuat tabel `siswa`, `guru`, dan `tebengan_requests` jika belum ada
 * 3. Melakukan migrasi data dari file JSON jika tersedia
 * 
 * Jalankan dengan:
 *   npm run migrate  atau  node migrate.js
 * ==============================================================================
 */

require('dotenv').config();
const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('\n=============================================================');
    console.log('🚀 MEMULAI MIGRASI DATABASE POSTGRESQL - BUSBUDDY SMAN 5');
    console.log('=============================================================');

    try {
        // 1. Buat Tabel Siswa
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
        `);
        console.log('✅ Tabel `siswa` terverifikasi.');

        // 2. Buat Tabel Guru
        await pool.query(`
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
        `);
        console.log('✅ Tabel `guru` terverifikasi.');

        // 3. Buat Tabel Permintaan Tebengan
        await pool.query(`
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
        console.log('✅ Tabel `tebengan_requests` terverifikasi.');

        // 4. Cek file backup jika ada
        const backupFile = path.join(__dirname, 'backup_migration.json');
        if (fs.existsSync(backupFile)) {
            console.log('\n📦 Ditemukan file migrasi data: backup_migration.json');
            try {
                const raw = fs.readFileSync(backupFile, 'utf8');
                const backup = JSON.parse(raw);
                let importedStudents = 0;
                let importedTeachers = 0;

                if (Array.isArray(backup.students) && backup.students.length > 0) {
                    for (const s of backup.students) {
                        await pool.query(`
                            INSERT INTO siswa 
                            (id, nisn, nama, kelas, absen, jenis_kelamin, password_hash,
                             lat, lng, area, rute_perjalanan, no_wa, status)
                            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                            ON CONFLICT (nisn) DO UPDATE SET nama = EXCLUDED.nama, kelas = EXCLUDED.kelas, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
                        `, [
                            s.id, s.nisn, s.nama, s.kelas || 'X-E 1', s.absen || 1,
                            s.jenisKelamin || 'Laki-laki', s.passwordHash || 'migrated',
                            s.lat || -7.2588, s.lng || 112.7430, s.area || 'Genteng Surabaya',
                            s.rutePerjalanan || 'Kawasan Pusat -> SMAN 5', s.noWa || '',
                            s.status || 'tersedia'
                        ]);
                        importedStudents++;
                    }
                }

                if (Array.isArray(backup.teachers) && backup.teachers.length > 0) {
                    for (const g of backup.teachers) {
                        await pool.query(`
                            INSERT INTO guru
                            (id, nip, nama, jabatan, jenis_kelamin, password_hash, no_wa, area)
                            VALUES (?,?,?,?,?,?,?,?)
                            ON CONFLICT (nip) DO UPDATE SET nama = EXCLUDED.nama, jabatan = EXCLUDED.jabatan;
                        `, [
                            g.id, g.nip, g.nama, g.jabatan || 'Guru SMAN 5 Surabaya',
                            g.jenisKelamin || 'Laki-laki', g.passwordHash || 'migrated',
                            g.noWa || '', g.area || 'Ruang Guru SMAN 5 Surabaya'
                        ]);
                        importedTeachers++;
                    }
                }

                console.log(`🎉 Berhasil memigrasikan: ${importedStudents} Siswa, ${importedTeachers} Guru.`);
            } catch (err) {
                console.warn('⚠️ Gagal membaca/mengimpor backup_migration.json:', err.message);
            }
        }

        // Tampilkan ringkasan tabel
        const [studentRows] = await pool.query('SELECT COUNT(*) as count FROM siswa');
        const [teacherRows] = await pool.query('SELECT COUNT(*) as count FROM guru');
        const [reqRows] = await pool.query('SELECT COUNT(*) as count FROM tebengan_requests');

        console.log('-------------------------------------------------------------');
        console.log(`📊 STATUS TERKINI DATABASE POSTGRESQL:`);
        console.log(`   - Siswa terdaftar : ${studentRows[0].count} orang`);
        console.log(`   - Guru terdaftar  : ${teacherRows[0].count} orang`);
        console.log(`   - Permintaan aktif: ${reqRows[0].count} permintaan`);
        console.log('=============================================================');
        console.log('✨ MIGRASI DATABASE POSTGRESQL BERHASIL PENUH & SELESAI!');
        console.log('=============================================================\n');

    } catch (err) {
        console.error('\n❌ KESALAHAN PADA PROSES MIGRASI:');
        console.error(err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    runMigration().then(() => pool.end && pool.end());
}

module.exports = { runMigration };
