require('dotenv').config();
const { pool } = require('./db');

async function diagnose() {
    try {
        // 1. Cek semua siswa dengan status raw dan waktu
        console.log('\n=== STATUS SISWA DI DATABASE ===');
        const [rows] = await pool.query(`
            SELECT id, nisn, nama, status, updated_at,
                   NOW() as db_now,
                   EXTRACT(EPOCH FROM (NOW() - updated_at)) as secs_since_update,
                   CASE 
                       WHEN status = 'offline' THEN 'offline'
                       WHEN updated_at >= NOW() - INTERVAL '90 seconds' THEN 'online'
                       ELSE 'offline'
                   END AS computed_status
            FROM siswa
            ORDER BY updated_at DESC
        `);
        
        rows.forEach(r => {
            const secAgo = Math.round(r.secs_since_update);
            const minAgo = Math.round(secAgo / 60);
            console.log(`${r.nama} | raw:${r.status} | computed:${r.computed_status} | updated: ${minAgo} menit lalu`);
        });

        // 2. Cek apakah ada masalah dengan timezone DB vs server
        const [timeRows] = await pool.query(`
            SELECT 
                NOW() as db_now_utc,
                NOW() AT TIME ZONE 'Asia/Jakarta' as db_now_wib,
                CURRENT_SETTING('TIMEZONE') as db_timezone
        `);
        console.log('\n=== INFO WAKTU DATABASE ===');
        console.log('Timezone DB:', timeRows[0].db_timezone);
        console.log('NOW() UTC:', timeRows[0].db_now_utc);
        console.log('NOW() WIB:', timeRows[0].db_now_wib);

        // 3. Simulasi heartbeat: update Aditya dan cek computed status langsung
        console.log('\n=== SIMULASI HEARTBEAT LANGSUNG ===');
        await pool.query("UPDATE siswa SET status='online', updated_at=CURRENT_TIMESTAMP WHERE nisn='0085651440'");
        const [after] = await pool.query(`
            SELECT nama, status, updated_at, 
                   EXTRACT(EPOCH FROM (NOW() - updated_at)) as secs_since,
                   CASE WHEN updated_at >= NOW() - INTERVAL '90 seconds' THEN 'online' ELSE 'offline' END as computed
            FROM siswa WHERE nisn='0085651440'
        `);
        console.log('Aditya setelah heartbeat:', after[0]);

        // 4. Cek apakah GET /students endpoint mengembalikan data yang benar
        console.log('\n=== ENDPOINT GET /students AKAN MENGEMBALIKAN ===');
        const [finalRows] = await pool.query(`
            SELECT id, nisn, nama,
                   CASE 
                       WHEN status = 'offline' THEN 'offline'
                       WHEN updated_at >= NOW() - INTERVAL '90 seconds' THEN 'online'
                       ELSE 'offline'
                   END AS status
            FROM siswa
        `);
        const onlineCount = finalRows.filter(r => r.status === 'online').length;
        console.log(`Total: ${finalRows.length} siswa, Online: ${onlineCount}, Offline: ${finalRows.length - onlineCount}`);

        process.exit(0);
    } catch(e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
}
diagnose();
