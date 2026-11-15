/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - DASHBOARD GURU & ANGKUTAN KOTA (js/dashboard/dashboard.js)
 * ==============================================================================
 */

const DashboardModule = {
    // 1. Dashboard Monitoring Kehadiran Siswa untuk Guru
    renderGuruDashboard() {
        const container = document.getElementById('guruDashboardContainer');
        if (!container) return;

        const totalSiswa = App.studentsData.length;
        const onlineSiswa = App.studentsData.filter(s => (s.status || '').toLowerCase() === 'online').length;
        const offlineSiswa = totalSiswa - onlineSiswa;

        container.innerHTML = `
            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px; margin-bottom:14px;">
                <b style="color:#1e3a8a; font-size:13px;">👨‍🏫 Monitoring Kehadiran & Keselamatan Siswa SMAN 5</b>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;">
                    <div style="background:white; padding:8px; border-radius:6px; text-align:center;">
                        <span style="font-size:20px; font-weight:700; color:#10b981;">${onlineSiswa}</span><br>
                        <span style="font-size:11px; color:#64748b;">Siswa Online</span>
                    </div>
                    <div style="background:white; padding:8px; border-radius:6px; text-align:center;">
                        <span style="font-size:20px; font-weight:700; color:#64748b;">${offlineSiswa}</span><br>
                        <span style="font-size:11px; color:#64748b;">Siswa Offline</span>
                    </div>
                </div>
            </div>

            <div style="font-size:12px; font-weight:700; color:#475569; margin-bottom:8px;">STATUS KEBERANGKATAN SISWA:</div>
            <div class="cards-list">
                ${App.studentsData.map(s => {
                    const isOnline = (s.status || '').toLowerCase() === 'online';
                    return `
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:6px; padding:10px; font-size:12px;">
                        <div style="display:flex; justify-content:space-between;">
                            <b>${s.nama} (${s.kelas})</b>
                            ${isOnline ? '<span style="color:#10b981; font-weight:700;">🟢 Online</span>' : '<span style="color:#94a3b8; font-weight:600;">⚪ Offline</span>'}
                        </div>
                        <div style="color:#64748b; margin-top:4px;">
                            Absen: ${s.absen || '-'} • NISN: ${s.nisn || '-'}<br>
                            Area: ${s.area || '-'}
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // 2. Daftar Integrasi Angkutan Kota Surabaya
    renderTransportList() {
        const container = document.getElementById('transportContainer');
        if (!container) return;

        let html = '';
        TRANSPORTASI_UMUM.forEach(tp => {
            const badgeColor = tp.tipe === 'feeder' ? '#059669' : (tp.tipe === 'kereta' ? '#2563eb' : '#6d28d9');
            html += `
                <div class="student-card" onclick="MapView.map && MapView.map.setView([${tp.lat}, ${tp.lng}], 17)">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <b style="font-size:13px; color:#1e293b;">${tp.nama}</b>
                        <span style="background:${badgeColor}; color:white; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px;">
                            ${tp.tipe.toUpperCase()}
                        </span>
                    </div>
                    <div style="font-size:12px; color:#64748b; margin-top:4px;">${tp.trayek}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
};

if (typeof window !== 'undefined') {
    window.DashboardModule = DashboardModule;
}
