/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - SCRIPT IMPOR DATA SISWA DARI GOOGLE SHEETS
 * ==============================================================================
 * Mengonversi data dari Google Sheets (CSV) ke format objek BusBuddy:
 * - Menghasilkan ID Siswa & NISN 10-digit
 * - Menghasilkan kata sandi resmi ("smala" + 5 digit terakhir NISN) & passwordHash SHA-256
 * - Memperbaiki format Latitude & Longitude (koma -> titik)
 * - Menentukan peran tebengan (Memberi tebengan / Mencari tebengan)
 * - Menentukan avatar berdasarkan gender
 * - Menyimpan ke database MySQL (jika aktif) dan membuat file backup_migration.json
 * ==============================================================================
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const mysql = require('mysql2/promise');

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1cp3WrmxTltGrVuAD2UNmuAYWHdBBl1GYJ6IALMdoKUM/export?format=csv';
const CSV_FILE = path.join(__dirname, 'students_sheet.csv');
const BACKUP_JSON = path.join(__dirname, 'backup_migration.json');

// Daftar nama siswi perempuan untuk penetapan avatar akurat
const FEMALE_NAMES = [
    'ALMIRA', 'ALUNA', 'ANINDYTALIA', 'ASYA', 'BILQIS', 'BUTSAINAH', 
    'DESAK', 'FATHYA', 'FILZA', 'HAURA', 'KOMANG', 'LIDIA', 'MIKAILA', 
    'NAVYRA', 'NIKITA', 'RR BRILIAN', 'SAFA', 'SHANAT', 'ZAAFIRA', 'ZULFIA'
];

function isFemale(name) {
    const upper = name.toUpperCase();
    return FEMALE_NAMES.some(fn => upper.includes(fn));
}

function hashPasswordNode(password) {
    const salt = "smala_salt_2026";
    return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const cols = [];
        let cur = '';
        let inQuotes = false;
        for (let c = 0; c < line.length; c++) {
            const ch = line[c];
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                cols.push(cur.trim());
                cur = '';
            } else {
                cur += ch;
            }
        }
        cols.push(cur.trim());
        rows.push(cols);
    }
    return rows;
}

function extractArea(address) {
    // Ambil bagian kecamatan / kelurahan dari alamat
    const matchKec = address.match(/Kec\.\s*([^,]+)/i);
    if (matchKec) return `${matchKec[1].trim()}, Surabaya`;
    const matchSurabaya = address.match(/([a-zA-Z\s]+),\s*(Surabaya|Sidoarjo)/i);
    if (matchSurabaya) return `${matchSurabaya[1].trim()}, ${matchSurabaya[2].trim()}`;
    return 'Surabaya';
}

async function fetchOrReadCSV() {
    if (fs.existsSync(CSV_FILE)) {
        return fs.readFileSync(CSV_FILE, 'utf8');
    }
    return new Promise((resolve, reject) => {
        function get(url) {
            https.get(url, res => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return get(res.headers.location);
                }
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    fs.writeFileSync(CSV_FILE, data, 'utf8');
                    resolve(data);
                });
            }).on('error', reject);
        }
        get(SHEET_CSV_URL);
    });
}

async function convertSheetToStudents() {
    const csvContent = await fetchOrReadCSV();
    const rows = parseCSV(csvContent);

    const femaleAvatars = [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=60'
    ];

    const maleAvatars = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=60'
    ];

    const students = rows.map((r, i) => {
        const absen = i + 1;
        const [rawNama, rawKelas, ttl, alamat, latStr, lngStr] = r;
        const nama = rawNama.replace(/\s+/g, ' ').trim();
        const kelas = rawKelas.trim() || 'XII-1';

        // Parsing TTL untuk tahun lahir
        let birthYear = '2009';
        const matchYear = ttl.match(/\b(200[789]|2010)\b/);
        if (matchYear) birthYear = matchYear[1];
        const prefixYear = '00' + birthYear.slice(-1); // 2008 -> '008', 2009 -> '009'
        const nisn = `${prefixYear}3501${absen.toString().padStart(3, '0')}`; // Contoh: 0093501001

        const autoPass = 'smala' + nisn.slice(-5);
        const passHash = hashPasswordNode(autoPass);

        const lat = parseFloat((latStr || '').replace(',', '.'));
        const lng = parseFloat((lngStr || '').replace(',', '.'));
        const gender = isFemale(nama) ? 'Perempuan' : 'Laki-laki';
        const area = extractArea(alamat);

        return {
            id: `SISWA-${absen.toString().padStart(3, '0')}`,
            nisn: nisn,
            nama: nama,
            kelas: kelas,
            absen: absen,
            jenisKelamin: gender,
            passwordHash: passHash,
            lat: lat,
            lng: lng,
            area: area,
            rutePerjalanan: `${area.split(',')[0]} -> SMAN 5 Surabaya`,
            noWa: '',
            status: 'tersedia',
            alamatLengkap: alamat,
            passwordBawaan: autoPass // Disertakan untuk referensi login siswa
        };
    });

    return students;
}

async function main() {
    console.log('\n=============================================================');
    console.log('📊 MENGONVERSI DATA GOOGLE SHEETS SISWA KELAS XII-1 SMAN 5');
    console.log('=============================================================');

    const students = await convertSheetToStudents();
    console.log(`✅ Berhasil memproses ${students.length} siswa dari Google Sheets.`);

    // 1. Simpan ke backup_migration.json
    let backupData = { students: [], teachers: [], requests: [] };
    if (fs.existsSync(BACKUP_JSON)) {
        try {
            backupData = JSON.parse(fs.readFileSync(BACKUP_JSON, 'utf8'));
        } catch (_) {}
    }
    backupData.students = students;
    fs.writeFileSync(BACKUP_JSON, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`💾 File '${path.basename(BACKUP_JSON)}' berhasil diperbarui.`);

    // 2. Simpan file students_xii_1.json untuk kemudahan akses
    const exportFile = path.join(__dirname, 'students_xii_1.json');
    fs.writeFileSync(exportFile, JSON.stringify(students, null, 2), 'utf8');
    console.log(`💾 File referensi '${path.basename(exportFile)}' berhasil dibuat.`);

    // 3. Simpan langsung ke database MySQL jika server MySQL aktif
    try {
        console.log('\n🔌 Mencoba menghubungkan ke database MySQL...');
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'busbuddy_db'
        });

        console.log('✅ Terhubung ke database MySQL. Memasukkan data siswa...');
        let inserted = 0;
        for (const s of students) {
            await conn.query(`
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
                s.noWa, s.status
            ]);
            inserted++;
        }
        await conn.end();
        console.log(`🎉 Berhasil memasukkan ${inserted} siswa ke tabel 'siswa' di MySQL!`);
    } catch (dbErr) {
        console.warn(`⚠️ MySQL belum berjalan (${dbErr.message}).`);
        console.warn('   Data sudah tersimpan di backup_migration.json dan siap dimigrasikan kapan saja.');
    }

    console.log('\n=============================================================');
    console.log('✨ CONTOH DATA SISWA TERDAFTAR:');
    students.slice(0, 3).forEach((s, i) => {
        console.log(`[${i+1}] ${s.nama} (${s.kelas})`);
        console.log(`    NISN       : ${s.nisn} (Password Login: ${s.passwordBawaan})`);
        console.log(`    Koordinat  : ${s.lat}, ${s.lng}`);
        console.log(`    Area       : ${s.area}`);
    });
    console.log('=============================================================\n');
}

if (require.main === module) {
    main();
}

module.exports = { convertSheetToStudents };

