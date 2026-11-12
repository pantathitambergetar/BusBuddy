/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - SKRIP MIGRASI DATABASE MySQL (migrate.js)
 * ==============================================================================
 * Skrip otomatis ini akan:
 * 1. Menghubungkan ke MySQL host (localhost)
 * 2. Membuat database `busbuddy_db` jika belum ada
 * 3. Membuat tabel `siswa`, `guru`, dan `tebengan_requests` jika belum ada
 * 4. Melakukan migrasi data dari file JSON jika tersedia
 * 
 * Jalankan dengan:
 *   npm run migrate  atau  node migrate.js
 * ==============================================================================
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('\n=============================================================');
    console.log('🚀 MEMULAI MIGRASI DATABASE MYSQL - BUSBUDDY SMAN 5 SURABAYA');
    console.log('=============================================================');

    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    };

    const dbName = process.env.DB_NAME || 'busbuddy_db';

    console.log(`📌 Host     : ${config.host}:${config.port}`);
    console.log(`📌 User     : ${config.user}`);
    console.log(`📌 Database : ${dbName}`);
    console.log('-------------------------------------------------------------');

    let connection;
    try {
        // 1. Hubungkan ke MySQL server tanpa memilih database dulu
        connection = await mysql.createConnection(config);
        console.log('✅ Berhasil terhubung ke server MySQL.');

        // 2. Buat database jika belum ada
        await connection.query(`
            CREATE DATABASE IF NOT EXISTS \`${dbName}\`
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        console.log(`✅ Database '${dbName}' siap digunakan.`);

        // 3. Gunakan database tersebut
        await connection.changeUser({ database: dbName });

        // 4. Buat Tabel Siswa
        await connection.query(`
            CREATE TABLE IF NOT EXISTS siswa (
                id              VARCHAR(20)     PRIMARY KEY,
                nisn            VARCHAR(20)     UNIQUE NOT NULL,
                nama            VARCHAR(100)    NOT NULL,
                kelas           VARCHAR(30)     DEFAULT 'X-E 1',
                absen           INT             DEFAULT 1,
                jenis_kelamin   VARCHAR(15)     DEFAULT 'Laki-laki',
                password_hash   VARCHAR(255)    NOT NULL,
                lat             DECIMAL(10,7)   DEFAULT -7.2588000,
                lng             DECIMAL(10,7)   DEFAULT 112.7430000,
                area            VARCHAR(100)    DEFAULT 'Genteng Surabaya',
                rute_perjalanan VARCHAR(200)    DEFAULT 'Kawasan Pusat -> SMAN 5',
                no_wa           VARCHAR(20)     DEFAULT '',
                status          VARCHAR(20)     DEFAULT 'tersedia',
                created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_nisn (nisn)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabel `siswa` terverifikasi.');

        // 5. Buat Tabel Guru
        await connection.query(`
            CREATE TABLE IF NOT EXISTS guru (
                id              VARCHAR(20)     PRIMARY KEY,
                nip             VARCHAR(30)     UNIQUE NOT NULL,
                nama            VARCHAR(100)    NOT NULL,
                jabatan         VARCHAR(100)    DEFAULT 'Guru SMAN 5 Surabaya',
                jenis_kelamin   VARCHAR(15)     DEFAULT 'Laki-laki',
                password_hash   VARCHAR(255)    NOT NULL,
                no_wa           VARCHAR(20)     DEFAULT '',
                area            VARCHAR(100)    DEFAULT 'Ruang Guru SMAN 5 Surabaya',
                created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_nip (nip)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabel `guru` terverifikasi.');

        // 6. Buat Tabel Permintaan Tebengan
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tebengan_requests (
                id              INT             AUTO_INCREMENT PRIMARY KEY,
                student_id      VARCHAR(20)     UNIQUE NOT NULL,
                student_name    VARCHAR(100)    NOT NULL,
                waktu           VARCHAR(20),
                status          VARCHAR(20)     DEFAULT 'menunggu',
                status_text     VARCHAR(50)     DEFAULT 'Menunggu Konfirmasi',
                created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_student_id (student_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabel `tebengan_requests` terverifikasi.');

        // 7. Cek apakah ada file data migrasi lokal (misal backup_migration.json)
        const backupFile = path.join(__dirname, 'backup_migration.json');
        if (fs.existsSync(backupFile)) {
            console.log('\n📦 Ditemukan file migrasi data: backup_migration.json');
            try {
                const raw = fs.readFileSync(backupFile, 'utf8');
                const backup = JSON.parse(raw);
                let importedStudents = 0;
                let importedTeachers = 0;

                if (Array.isArray(backup.students)) {
                    for (const s of backup.students) {
                        await connection.query(`
                            INSERT INTO siswa 
                            (id, nisn, nama, kelas, absen, jenis_kelamin, password_hash,
                             lat, lng, area, rute_perjalanan, no_wa, status)
                            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                            ON DUPLICATE KEY UPDATE nama=VALUES(nama), kelas=VALUES(kelas), lat=VALUES(lat), lng=VALUES(lng);
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

                if (Array.isArray(backup.teachers)) {
                    for (const g of backup.teachers) {
                        await connection.query(`
                            INSERT INTO guru
                            (id, nip, nama, jabatan, jenis_kelamin, password_hash, no_wa, area)
                            VALUES (?,?,?,?,?,?,?,?)
                            ON DUPLICATE KEY UPDATE nama=VALUES(nama), jabatan=VALUES(jabatan);
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
        const [studentCount] = await connection.query('SELECT COUNT(*) as count FROM siswa');
        const [teacherCount] = await connection.query('SELECT COUNT(*) as count FROM guru');
        const [reqCount] = await connection.query('SELECT COUNT(*) as count FROM tebengan_requests');

        console.log('-------------------------------------------------------------');
        console.log(`📊 STATUS TERKINI DATABASE '${dbName}':`);
        console.log(`   - Siswa terdaftar : ${studentCount[0].count} orang`);
        console.log(`   - Guru terdaftar  : ${teacherCount[0].count} orang`);
        console.log(`   - Permintaan aktif: ${reqCount[0].count} permintaan`);
        console.log('=============================================================');
        console.log('✨ MIGRASI DATABASE BERHASIL PENUH & SELESAI!');
        console.log('=============================================================\n');

    } catch (err) {
        console.error('\n❌ KESALAHAN PADA PROSES MIGRASI:');
        console.error(err.message);
        console.error('\n💡 Solusi:');
        console.error('1. Pastikan layanan MySQL (seperti XAMPP MySQL atau MySQL Server) sudah berjalan.');
        console.error('2. Periksa kecocokan password root di file server/.env');
        console.error('3. Port default MySQL adalah 3306.');
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

// Jalankan jika dieksekusi langsung
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
