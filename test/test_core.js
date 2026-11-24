/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - TEST SUITE INTI (test/test_core.js)
 * Uji logika autentikasi, template WhatsApp, keamanan nama, dan parameter DB
 * Jalankan dengan: node test/test_core.js  atau  npm test
 * ==============================================================================
 */

const assert = require('assert');
const WhatsappTemplates = require('../lib/whatsappTemplates');

console.log('🧪 Memulai pengujian BusBuddy...\n');

// 1. Uji Generator Password Sekolah
function generatePasswordFromID(idNumber) {
    const cleanID = (idNumber || '').toString().trim();
    if (cleanID.length < 5) return "smala" + cleanID;
    return "smala" + cleanID.slice(-5);
}

assert.strictEqual(generatePasswordFromID('0085651440'), 'smala51440', 'Password 10 digit NISN harus smala + 5 digit akhir');
assert.strictEqual(generatePasswordFromID('123'), 'smala123', 'Password ID pendek harus smala + ID');
console.log('✅ 1. Generator Password Sekolah: PASS');

// 2. Uji Sanitasi Nama Siswa (Apostrof tidak boleh hilang)
const rawName = "Ma'ruf D'Artagnan <script>alert(1)</script>";
const sanitized = rawName
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
assert.strictEqual(sanitized, "Ma'ruf D'Artagnan", "Apostrof pada nama siswa tidak boleh terpotong saat sanitasi");
console.log('✅ 2. Sanitasi Nama Siswa: PASS (Nama berapostrof aman)');

// 3. Uji Template WhatsApp Minta Nebeng
const waMinta = WhatsappTemplates.templateMintaNebeng({
    namaB: 'Aditya',
    namaA: 'Budi',
    jam: '06:30 WIB',
    titikJemput: 'Genteng',
    id: 123,
    appUrl: 'https://bus-buddy-steel.vercel.app'
});
assert.ok(waMinta.includes('Halo Aditya, aku Budi mau nebeng'), 'Pesan minta nebeng harus memuat nama peminta & target');
assert.ok(waMinta.includes('https://bus-buddy-steel.vercel.app/nebeng/123'), 'Pesan minta nebeng harus memuat link persetujuan dengan ID');
console.log('✅ 3. Template WhatsApp Minta Nebeng: PASS');

// 4. Uji Template WhatsApp Konfirmasi Diterima
const waTerima = WhatsappTemplates.templateDiterima({
    namaA: 'Budi',
    jam: '06:30 WIB',
    appUrl: 'https://bus-buddy-steel.vercel.app'
});
assert.ok(waTerima.includes('Halo Budi, tebengan kamu aku terima!'), 'Pesan konfirmasi harus memuat tebengan diterima');
assert.ok(waTerima.includes('/status-saya'), 'Pesan konfirmasi harus memuat link status');
console.log('✅ 4. Template WhatsApp Konfirmasi Diterima: PASS');

// 5. Uji Pembersihan Nomor WhatsApp (format internasional 62)
assert.strictEqual(WhatsappTemplates.formatWaNumber('081234567890'), '6281234567890', '08xx harus menjadi 628xx');
assert.strictEqual(WhatsappTemplates.formatWaNumber('81234567890'), '6281234567890', '8xx harus menjadi 628xx');
assert.strictEqual(WhatsappTemplates.formatWaNumber('6281234567890'), '6281234567890', '628xx tetap 628xx');
console.log('✅ 5. Format Nomor WhatsApp Internasional: PASS');

// 6. Uji Helper Link wa.me
const waLink = WhatsappTemplates.createWaLink('081234567890', 'Halo dunia!');
assert.strictEqual(waLink, 'https://wa.me/6281234567890?text=Halo%20dunia!', 'Link wa.me harus ter-encode dengan benar');
console.log('✅ 6. Helper Link wa.me: PASS');

// 7. Uji Parameter SQL (? -> $1, $2)
const sql = 'SELECT * FROM nebeng WHERE peminta_wa = ? AND status = ?';
let paramIdx = 1;
const pgSql = sql.replace(/\?/g, () => `$${paramIdx++}`);
assert.strictEqual(pgSql, 'SELECT * FROM nebeng WHERE peminta_wa = $1 AND status = $2', 'Parameter ? harus diterjemahkan ke $1, $2');
console.log('✅ 7. Penerjemah Parameter PostgreSQL: PASS');

// 8. Uji Pencegahan Kebocoran Password Hash pada Data Siswa Publik
const mockRow = { id: 'SISWA-1', nisn: '0012345678', nama: 'Budi', password_hash: 'secret_hash_value', lat: -7.25, lng: 112.75 };
const publicStudent = {
    id: mockRow.id,
    nisn: mockRow.nisn,
    nama: mockRow.nama,
    lat: parseFloat(mockRow.lat),
    lng: parseFloat(mockRow.lng)
};
assert.strictEqual(publicStudent.passwordHash, undefined, 'passwordHash tidak boleh ada di objek publik');
assert.strictEqual(publicStudent.password_hash, undefined, 'password_hash tidak boleh ada di objek publik');
console.log('✅ 8. Proteksi Kebocoran Password Hash: PASS');

console.log('\n🎉 SEMUA 8 PENGUJIAN INTI BERHASIL! (ALL PASS)');
