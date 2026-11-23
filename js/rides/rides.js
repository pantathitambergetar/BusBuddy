/**
 * BUSBUDDY SMAN 5 SURABAYA - FITUR TEBENGAN SISWA (js/rides/rides.js)
 */
const RidesModule = {
    activeNebeng: null, pendingWaLink: null, finishedWaLink: null,

    async syncActiveNebeng() {
        if (!App.currentUser || !ApiService.isOnline) return;
        const res = await ApiService.getActiveNebeng(App.currentUser.noWa || '', App.currentUser.nama || '');
        if (res && res.success) { this.activeNebeng = res.data || null; this.renderUserRideStatus(); }
    },

    clearActiveNebeng() {
        this.activeNebeng = null; this.pendingWaLink = null; this.finishedWaLink = null;
        this.renderUserRideStatus();
    },

    // 1. Render Status Perjalanan Pengguna Aktif & Status Nebeng Realtime
    renderUserRideStatus() {
        const container = document.getElementById('userRideStatusContainer');
        if (!container || !App.currentUser || App.currentUser.peran === 'developer') {
            if (container) container.innerHTML = '';
            return;
        }

        const isOnline = ApiService.isOnline;
        const statusBadge = isOnline 
            ? '<span style="background:#dcfce7; color:#15803d; font-weight:700; padding:2px 8px; border-radius:10px; font-size:10px;">🟢 ONLINE</span>'
            : '<span style="background:#f1f5f9; color:#64748b; font-weight:700; padding:2px 8px; border-radius:10px; font-size:10px;">⚪ OFFLINE</span>';

        let nebengHtml = '';
        if (this.finishedWaLink) {
            nebengHtml = `<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:10px; margin-top:8px;">
                <b style="color:#15803d; font-size:12px;">🏁 Nebeng Selesai!</b>
                <a href="${this.finishedWaLink}" target="_blank" class="btn btn-wa" style="display:block; text-align:center; padding:8px; margin-top:6px; font-weight:700; border-radius:6px; text-decoration:none;">💬 Kirim Pesan Selesai via WhatsApp</a>
                <button onclick="RidesModule.clearActiveNebeng()" class="btn btn-secondary" style="width:100%; margin-top:6px; font-size:10px; padding:4px;">Tutup</button>
            </div>`;
        } else if (this.activeNebeng) {
            const st = (this.activeNebeng.status || 'pending').toLowerCase();
            const isPeminta = App.currentUser.nama === this.activeNebeng.peminta_nama;
            const targetNama = isPeminta ? this.activeNebeng.pemberi_nama : this.activeNebeng.peminta_nama;

            if (st === 'pending') {
                const linkWa = this.pendingWaLink || (window.WhatsappTemplates ? WhatsappTemplates.createWaLink(
                    this.activeNebeng.pemberi_wa,
                    WhatsappTemplates.templateMintaNebeng({ namaB: this.activeNebeng.pemberi_nama, namaA: this.activeNebeng.peminta_nama, jam: this.activeNebeng.jam_berangkat, titikJemput: this.activeNebeng.titik_jemput, id: this.activeNebeng.id })
                ) : '#');

                nebengHtml = isPeminta ? `<div style="background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:10px; margin-top:8px; font-size:12px;">
                    <b style="color:#92400e;">⏳ Menunggu Persetujuan</b>
                    <p style="color:#78350f; font-size:11px; margin:4px 0 8px 0;">Menunggu persetujuan dari <b>${targetNama}</b>... Link WhatsApp sudah dibuat, pastikan kamu sudah pencet Send.</p>
                    <a href="${linkWa}" target="_blank" class="btn btn-wa" style="display:block; text-align:center; padding:8px; font-weight:700; border-radius:6px; text-decoration:none;">📲 Kirim Permintaan via WhatsApp</a>
                </div>` : `<div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px; margin-top:8px; font-size:12px;">
                    <b style="color:#1e3a8a;">📩 Permintaan Nebeng Masuk!</b>
                    <p style="color:#475569; font-size:11px; margin:4px 0 8px 0;"><b>${targetNama}</b> ingin nebeng jam ${this.activeNebeng.jam_berangkat}.</p>
                    <a href="/nebeng/${this.activeNebeng.id}" class="btn btn-primary" style="display:block; text-align:center; padding:7px; font-size:11px; text-decoration:none;">👉 Buka Halaman Persetujuan</a>
                </div>`;
            } else if (st === 'approved') {
                nebengHtml = `<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:10px; margin-top:8px; font-size:12px;">
                    <b style="color:#15803d;">🚗 Nebeng Sedang Berjalan</b>
                    <p style="color:#166534; font-size:11px; margin:4px 0 8px 0;">${isPeminta ? `Kamu dapat tebengan dari <b>${targetNama}</b>! Berangkat jam ${this.activeNebeng.jam_berangkat}` : `Memberi tebengan ke <b>${targetNama}</b> (Jam ${this.activeNebeng.jam_berangkat})`}</p>
                    <button onclick="App.finishNebeng(${this.activeNebeng.id})" class="btn" style="background:#f59e0b; color:white; border:none; width:100%; padding:8px; font-weight:700; border-radius:6px; cursor:pointer;">🏁 Akhiri Nebeng / Sudah Sampai</button>
                </div>`;
            } else if (st === 'rejected') {
                nebengHtml = `<div style="background:#fee2e2; border:1px solid #fecaca; border-radius:8px; padding:10px; margin-top:8px; font-size:12px; color:#991b1b;">
                    <b>❌ Maaf, permintaan ditolak</b>
                    <button onclick="RidesModule.clearActiveNebeng()" class="btn btn-secondary" style="width:100%; margin-top:6px; font-size:10px; padding:4px;">Tutup</button>
                </div>`;
            }
        }

        container.innerHTML = `<div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 12px; margin-bottom:10px; font-size:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-weight:700; color:#1e3a8a;">🎒 ${App.currentUser.nama}</span>
                ${statusBadge}
            </div>
            ${nebengHtml}
        </div>`;
    },

    // 2. Render Daftar Teman Sekitar
    renderFriendsList() {
        const container = document.getElementById('cardsContainer');
        if (!container) return;
        this.renderUserRideStatus();

        const currentId = App.currentUser ? App.currentUser.id : null;
        const currentNisn = App.currentUser ? App.currentUser.nisn : null;

        const allOthers = App.studentsData.filter(s => {
            if (currentId && s.id === currentId) return false;
            if (currentNisn && s.nisn === currentNisn) return false;
            if (App.filterJarakKm !== null && NavigationModule.userCoords) {
                const dist = NavigationModule.getDistanceKm(NavigationModule.userCoords[0], NavigationModule.userCoords[1], s.lat, s.lng);
                if (dist > App.filterJarakKm) return false;
            }
            return true;
        });

        const forMap = App.studentsData.filter(s => {
            if (currentId && s.id === currentId) return false;
            if (currentNisn && s.nisn === currentNisn) return false;
            return (s.status || '').toLowerCase() === 'online';
        });
        MapManager.renderFriends(forMap);

        if (App.studentsData.length === 0 || (App.studentsData.length === 1 && currentId)) {
            container.innerHTML = `<div style="text-align:center; padding:24px; color:#64748b; font-size:12px;"><b>Belum Ada Teman Terdaftar</b></div>`;
            return;
        }

        if (allOthers.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:24px; color:#64748b; font-size:12px;"><b>Tidak ada teman di radius ini</b></div>`;
            return;
        }

        container.innerHTML = allOthers.map(s => this.buildCard(s)).join('');
    },

    buildCard(student) {
        let jarakBadge = '';
        if (NavigationModule.userCoords) {
            const km = NavigationModule.getDistanceKm(NavigationModule.userCoords[0], NavigationModule.userCoords[1], student.lat, student.lng);
            jarakBadge = `<span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:600; font-size:10px; color:#475569;">📍 ${km.toFixed(1)} km</span>`;
        }

        const isOnline = (student.status || '').toLowerCase() === 'online';
        const stBadge = isOnline 
            ? '<span style="background:#dcfce7; color:#15803d; font-size:10px; font-weight:700; padding:2px 6px; border-radius:10px; margin-left:6px;">🟢 Online</span>'
            : '<span style="background:#f1f5f9; color:#64748b; font-size:10px; font-weight:700; padding:2px 6px; border-radius:10px; margin-left:6px;">⚪ Offline</span>';

        return `
            <div class="student-card" onclick="MapView.map && MapView.map.setView([${student.lat}, ${student.lng}], 16)">
                <div class="student-header">
                    <div class="student-info">
                        <div class="student-name">${student.nama} ${stBadge}</div>
                        <div class="student-class">${student.kelas} • Absen ${student.absen || '-'} • NISN: ${student.nisn || '-'}</div>
                    </div>
                </div>
                <div class="student-body">
                    <div class="item">
                        <span>📍 Area: <b>${student.area || '-'}</b></span>
                        <span style="margin-left:auto;">${jarakBadge}</span>
                    </div>
                    <div class="item">
                        <span style="font-size:11px; color:#64748b;">🛣️ ${student.rutePerjalanan || '-'}</span>
                    </div>
                </div>
                <div class="student-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-primary" onclick="App.offerRideTo('${student.id}')">🚗 Ajak Berangkat</button>
                    <button class="btn btn-primary" style="background:#0284c7;" onclick="App.requestRide('${student.id}')">🙋 Minta Nebeng</button>
                </div>
            </div>
        `;
    },

    // 3. Minta Nebeng (Simpan di Database status=pending & siapkan link WhatsApp)
    async requestRide(studentId) {
        const student = App.studentsData.find(s => s.id === studentId);
        if (!student) return;

        if (App.currentUser && (student.id === App.currentUser.id || student.nisn === App.currentUser.nisn)) {
            App.showToast("⚠️ Anda tidak bisa meminta nebeng ke diri sendiri!");
            return;
        }

        if (!student.noWa) {
            App.showToast(`⚠️ ${student.nama} belum mencantumkan nomor WhatsApp.`);
            return;
        }

        const pemintaNama = App.currentUser ? App.currentUser.nama : 'Teman SMAN 5';
        const pemintaWa = App.currentUser ? (App.currentUser.noWa || '6281234567890') : '6281234567890';
        const titikJemput = (App.currentUser && App.currentUser.area) ? App.currentUser.area : (student.area || 'Kawasan SMAN 5');
        const jam = '06:30 WIB';

        const res = await ApiService.createNebeng({
            peminta_nama: pemintaNama, peminta_wa: pemintaWa,
            pemberi_nama: student.nama, pemberi_wa: student.noWa,
            titik_jemput: titikJemput, jam_berangkat: jam
        });

        if (res && res.success && res.data) {
            this.activeNebeng = res.data;
            const text = window.WhatsappTemplates ? WhatsappTemplates.templateMintaNebeng({
                namaB: student.nama, namaA: pemintaNama, jam: jam, titikJemput: titikJemput, id: res.data.id
            }) : `Halo ${student.nama}, aku ${pemintaNama} mau nebeng. Buka: /nebeng/${res.data.id}`;

            this.pendingWaLink = window.WhatsappTemplates ? WhatsappTemplates.createWaLink(student.noWa, text) : `https://wa.me/${student.noWa}`;
            window.open(this.pendingWaLink, '_blank');
            this.renderUserRideStatus();
            App.showToast(`📲 Link WA dibuat! Menunggu persetujuan dari ${student.nama}...`);
        } else {
            App.showToast(`⚠️ ${res && res.message ? res.message : 'Gagal membuat permintaan nebeng'}`);
        }
    },

    // 4. Ajak Berangkat (Langsung WA)
    offerRideTo(studentId) {
        const student = App.studentsData.find(s => s.id === studentId);
        if (!student || !student.noWa) {
            App.showToast("⚠️ Kontak WhatsApp teman belum tersedia.");
            return;
        }
        const senderNama = App.currentUser ? App.currentUser.nama : 'Teman SMAN 5';
        const pesan = `Halo ${student.nama}! Saya ${senderNama} dari BusBuddy SMAN 5 Surabaya. Rute kita searah, apakah mau berangkat bareng? 😊`;
        const link = window.WhatsappTemplates ? WhatsappTemplates.createWaLink(student.noWa, pesan) : `https://wa.me/${student.noWa}`;
        window.open(link, '_blank');
        App.showToast(`🚗 Menghubungi ${student.nama}...`);
    },

    openWhatsAppChat(studentId) { this.offerRideTo(studentId); },

    // 5. Akhiri Nebeng (Ubah status ke finished & siapkan pesan selesai WhatsApp)
    async finishNebeng(nebengId) {
        if (!this.activeNebeng) return;
        const targetWa = (App.currentUser && App.currentUser.nama === this.activeNebeng.peminta_nama)
            ? this.activeNebeng.pemberi_wa : this.activeNebeng.peminta_wa;

        const res = await ApiService.updateNebengStatus(nebengId, 'finished');
        if (res && res.success) {
            const sender = App.currentUser ? App.currentUser.nama : 'Teman SMAN 5';
            const text = window.WhatsappTemplates 
                ? WhatsappTemplates.templateAkhiriNebeng({ namaPengirim: sender })
                : `Halo, nebeng kita sudah selesai. Terima kasih sudah nebeng bareng! - ${sender}`;

            this.finishedWaLink = window.WhatsappTemplates ? WhatsappTemplates.createWaLink(targetWa, text) : `https://wa.me/${targetWa}`;
            this.activeNebeng = null;
            window.open(this.finishedWaLink, '_blank');
            this.renderUserRideStatus();
            App.showToast("🏁 Nebeng selesai! Kirim pesan terima kasih via WhatsApp.");
        } else {
            App.showToast("Gagal mengakhiri nebeng.");
        }
    },

    // 6. Rekomendasi Terdekat
    searchNearestRide() {
        const container = document.getElementById('smartRecommendationContainer');
        if (!container || !NavigationModule.userCoords) {
            App.showToast("📍 Aktifkan GPS untuk melihat rekomendasi terdekat!");
            return;
        }

        const currentId = App.currentUser ? App.currentUser.id : null;
        const candidates = App.studentsData
            .filter(s => currentId ? s.id !== currentId : true)
            .map(s => ({ ...s, _dist: NavigationModule.getDistanceKm(NavigationModule.userCoords[0], NavigationModule.userCoords[1], s.lat, s.lng) }))
            .sort((a, b) => a._dist - b._dist).slice(0, 3);

        if (candidates.length === 0) return;

        let html = `<div style="font-size:11px; font-weight:700; color:#92400e; background:#fef3c7; padding:4px 8px; border-radius:6px; margin-bottom:6px;">🎯 Rekomendasi Terdekat</div>`;
        candidates.forEach((s, i) => {
            html += `<div style="background:white; border:1px solid #fde68a; border-left:3px solid #f59e0b; border-radius:6px; padding:6px 8px; margin-bottom:6px; font-size:11px;">
                <div style="display:flex; justify-content:space-between;">
                    <b>#${i+1} ${s.nama} (${s.kelas})</b>
                    <span style="color:#92400e; font-weight:700;">📍 ${s._dist.toFixed(1)} km</span>
                </div>
                <div style="margin-top:4px; display:flex; gap:4px;">
                    <button class="btn btn-primary" style="font-size:10px; padding:3px 6px;" onclick="App.offerRideTo('${s.id}')">🚗 Ajak</button>
                    <button class="btn btn-primary" style="background:#0284c7;" onclick="App.requestRide('${s.id}')">🙋 Minta Nebeng</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
        App.showToast(`🎯 Ditemukan ${candidates.length} teman terdekat!`);
    }
};

if (typeof window !== 'undefined') {
    window.RidesModule = RidesModule;
}
