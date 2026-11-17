require('dotenv').config();
const { pool } = require('./db');

async function testHeartbeat() {
    try {
        console.log('--- TEST 1: Heartbeat by NISN ---');
        // Test update heartbeat Aditya (nisn: 0085651440)
        const targetId = '0085651440';
        await pool.query(
            "UPDATE siswa SET status = 'online', updated_at = CURRENT_TIMESTAMP WHERE id = ? OR nisn = ?",
            [targetId, targetId]
        );

        const [rows] = await pool.query(`
            SELECT id, nisn, nama,
                   CASE 
                       WHEN status = 'offline' THEN 'offline'
                       WHEN updated_at >= NOW() - INTERVAL '90 seconds' THEN 'online'
                       ELSE 'offline'
                   END AS computed_status,
                   updated_at
            FROM siswa WHERE nisn = ?
        `, [targetId]);

        console.log('HASIL TEST ADITYA:', rows[0]);
        if (rows[0].computed_status === 'online') {
            console.log('✅ TEST PASSED: Status Aditya sekarang ONLINE!');
        } else {
            console.error('❌ TEST FAILED');
        }

        process.exit(0);
    } catch(e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
}
testHeartbeat();
