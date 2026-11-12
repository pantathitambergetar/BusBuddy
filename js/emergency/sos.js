/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - PUSAT BANTUAN DARURAT SISWA (js/emergency/sos.js)
 * ==============================================================================
 */

const EmergencyModule = {
    triggerModal() {
        const modal = document.getElementById('sosModal');
        if (!modal) return;

        const coords = NavigationModule.userCoords;
        const text = coords
            ? `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`
            : `-7.25747, 112.75023 (Kawasan SMAN 5 Surabaya)`;

        const el = document.getElementById('sosCurrentCoord');
        if (el) el.innerText = text;

        modal.classList.add('active');
    },

    closeModal() {
        const modal = document.getElementById('sosModal');
        if (modal) modal.classList.remove('active');
    },

    sendWhatsApp(targetNumber) {
        const coords = NavigationModule.userCoords || [SEKOLAH_DATA.lat, SEKOLAH_DATA.lng];
        const mapsLink = `https://maps.google.com/?q=${coords[0]},${coords[1]}`;
        const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        const nama = App.currentUser ? App.currentUser.nama : 'Siswa SMAN 5';
        const id = App.currentUser ? (App.currentUser.nisn || App.currentUser.nip || '-') : '-';

        const pesan = `🚨 *TOMBOL DARURAT SISWA BUSBUDDY* 🚨\n\nNama: ${nama}\nID (NISN/NIP): ${id}\nWaktu: ${jam}\n\n*Saya mengalami kendala/kondisi darurat dalam perjalanan menuju SMAN 5 Surabaya!*\n\n📍 *Titik Lokasi GPS Terkini:*\n${mapsLink}\n\nMohon segera bantuan petugas keamanan / guru piket sekolah!`;
        window.open(`https://api.whatsapp.com/send?phone=${targetNumber}&text=${encodeURIComponent(pesan)}`, '_blank');
    },

    copyLink() {
        const coords = NavigationModule.userCoords || [SEKOLAH_DATA.lat, SEKOLAH_DATA.lng];
        const mapsLink = `https://maps.google.com/?q=${coords[0]},${coords[1]}`;
        navigator.clipboard.writeText(mapsLink).then(() => {
            App.showToast("📋 Link lokasi darurat berhasil disalin ke clipboard!");
        }).catch(() => {
            alert(`Link Lokasi: ${mapsLink}`);
        });
    },

    renderContacts() {
        const listEl = document.getElementById('sosContactsList');
        if (!listEl) return;

        let html = '';
        KONTAK_DARURAT.forEach(k => {
            html += `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <b style="font-size:13px; color:#1e293b;">${k.jabatan}</b><br>
                        <span style="font-size:12px; color:#64748b;">${k.nama} (${k.telepon})</span>
                    </div>
                    <button onclick="App.sendSosWhatsApp('${k.noWa}')" class="btn btn-wa" style="padding:6px 10px; font-size:11px;">
                        WA Darurat
                    </button>
                </div>
            `;
        });
        listEl.innerHTML = html;
    }
};

if (typeof window !== 'undefined') {
    window.EmergencyModule = EmergencyModule;
}
