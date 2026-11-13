/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - FITUR TEBENGAN SISWA (js/rides/rides.js)
 * ==============================================================================
 */

const RidesModule = {
    // 1. Render Status Perjalanan Pengguna Aktif
    renderUserRideStatus() {
        const container = document.getElementById('userRideStatusContainer');
        if (!container || !App.currentUser || App.currentUser.peran === 'developer') {
            if (container) container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 12px; margin-bottom:10px; font-size:12px;">
                <div style="font-weight:700; color:#1e3a8a; margin-bottom:3px;">
                    🎒 Siswa SMAN 5 Surabaya
                </div>
                <div style="color:#475569; font-size:11px;">
                    Temukan teman satu rute menuju sekolah untuk berangkat bersama.
                </div>
            </div>
        `;
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
                const dist = NavigationModule.getDistanceKm(
                    NavigationModule.userCoords[0], NavigationModule.userCoords[1],
                    s.lat, s.lng
                );
                if (dist > App.filterJarakKm) return false;
            }
            return true;
        });

        const forMap = App.studentsData.filter(s => {
            if (currentId && s.id === currentId) return false;
            if (currentNisn && s.nisn === currentNisn) return false;
            return true;
        });
        MapManager.renderFriends(forMap);

        if (App.studentsData.length === 0 || (App.studentsData.length === 1 && currentId)) {
            container.innerHTML = `
                <div style="text-align:center; padding:32px 16px; color:#64748b; font-size:13px;">
                    <p style="font-size:36px; margin-bottom:8px;">👥</p>
                    <b>Belum Ada Teman Terdaftar</b><br>
                    <span style="font-size:11px; color:#94a3b8; display:block; margin-top:6px; line-height:1.5;">
                        Belum ada siswa lain yang mendaftar.<br>
                        Data teman akan muncul otomatis begitu mereka mendaftar di web ini.
                    </span>
                </div>
            `;
            return;
        }

        if (allOthers.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:30px 10px; color:#64748b; font-size:13px;">
                    <p style="font-size:32px; margin-bottom:8px;">🔍</p>
                    <b>Tidak ada teman yang cocok</b><br>
                    Coba ubah atau perbesar radius filter jarak.
                </div>
            `;
            return;
        }

        let html = '';
        allOthers.forEach(s => {
            html += this.buildCard(s, 'request');
        });
        container.innerHTML = html;
    },

    buildCard(student, actionType) {
        let jarakBadge = '';
        if (NavigationModule.userCoords) {
            const km = NavigationModule.getDistanceKm(NavigationModule.userCoords[0], NavigationModule.userCoords[1], student.lat, student.lng);
            jarakBadge = `<span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:600; font-size:11px; color:#475569;">📍 ${km.toFixed(1)} km</span>`;
        }

        const request = App.requestsData.find(r => r.studentId === student.id);
        let btnAction = '';
        if (request) {
            btnAction = `<button class="btn btn-secondary" style="font-size:11px;" disabled>⏳ ${request.statusText}</button>`;
        } else {
            btnAction = `<button class="btn btn-primary" onclick="App.requestRide('${student.id}')">🤝 Ajak Berangkat</button>`;
        }

        return `
            <div class="student-card" onclick="MapView.map && MapView.map.setView([${student.lat}, ${student.lng}], 16)">
                <div class="student-header">
                    <div class="student-info">
                        <div>
                            <div class="student-name">${student.nama}</div>
                            <div class="student-class">${student.kelas} • Absen ${student.absen || '-'} • NISN: ${student.nisn || '-'}</div>
                        </div>
                    </div>
                </div>
                <div class="student-body">
                    <div class="item">
                        <span>📍</span>
                        <span>Area: <b>${student.area || '-'}</b></span>
                        <span style="margin-left:auto;">${jarakBadge}</span>
                    </div>
                    <div class="item">
                        <span>🛣️</span>
                        <span style="font-size:11px; color:#64748b;">Rute: ${student.rutePerjalanan || '-'}</span>
                    </div>
                </div>
                <div class="student-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-primary" onclick="App.offerRideTo('${student.id}')">🚗 Ajak Berangkat</button>
                    <button class="btn btn-primary" style="background:#0284c7;" onclick="App.requestRide('${student.id}')">🙋 Minta Bareng</button>
                </div>
            </div>
        `;
    },

    // 3. Minta Bareng (Langsung WA)
    requestRide(studentId) {
        const student = App.studentsData.find(s => s.id === studentId);
        if (!student) return;

        if (App.currentUser && (student.id === App.currentUser.id || student.nisn === App.currentUser.nisn)) {
            App.showToast("⚠️ Anda tidak bisa meminta bareng ke diri sendiri!");
            return;
        }

        if (!student.noWa) {
            App.showToast(`⚠️ ${student.nama} belum mencantumkan nomor WhatsApp.`);
            return;
        }

        const senderNama = App.currentUser ? App.currentUser.nama : 'Teman SMAN 5';
        const senderInfo = App.currentUser ? (App.currentUser.kelas || 'SMAN 5') : 'SMAN 5';
        const pesan = `Halo ${student.nama}! Saya ${senderNama} (${senderInfo}) dari BusBuddy SMAN 5 Surabaya. Apakah saya boleh nebeng / minta bareng berangkat ke sekolah bareng kamu? 😊`;

        window.open(`https://api.whatsapp.com/send?phone=${student.noWa}&text=${encodeURIComponent(pesan)}`, '_blank');
        App.showToast(`📱 Menghubungi ${student.nama} untuk minta bareng...`);
        MapManager.routeToDestination(student.lat, student.lng, student.nama);
    },

    // 4. Ajak Berangkat (Langsung WA)
    offerRideTo(studentId) {
        const student = App.studentsData.find(s => s.id === studentId);
        if (!student) return;

        if (App.currentUser && (student.id === App.currentUser.id || student.nisn === App.currentUser.nisn)) {
            App.showToast("⚠️ Anda tidak bisa mengajak diri sendiri!");
            return;
        }

        if (!student.noWa) {
            App.showToast(`⚠️ ${student.nama} belum mencantumkan nomor WhatsApp.`);
            return;
        }

        const senderNama = App.currentUser ? App.currentUser.nama : 'Teman SMAN 5';
        const senderInfo = App.currentUser ? (App.currentUser.kelas || 'SMAN 5') : 'SMAN 5';
        const pesan = `Halo ${student.nama}! Saya ${senderNama} (${senderInfo}) dari BusBuddy SMAN 5 Surabaya. Rute kita searah, apakah mau berangkat bareng ke sekolah? 😊`;

        window.open(`https://api.whatsapp.com/send?phone=${student.noWa}&text=${encodeURIComponent(pesan)}`, '_blank');
        App.showToast(`🚗 Menghubungi ${student.nama} untuk mengajak berangkat...`);
        MapManager.routeToDestination(student.lat, student.lng, student.nama);
    },

    // 5. Chat WhatsApp Umum
    openWhatsAppChat(studentId) {
        this.offerRideTo(studentId);
    },

    // 6. Rekomendasi Terdekat
    searchNearestRide() {
        const container = document.getElementById('smartRecommendationContainer');
        if (!container) return;

        if (!NavigationModule.userCoords) {
            App.showToast("📍 Aktifkan GPS terlebih dahulu untuk melihat rekomendasi terdekat!");
            return;
        }

        const currentId = App.currentUser ? App.currentUser.id : null;
        const currentNisn = App.currentUser ? App.currentUser.nisn : null;

        const candidates = App.studentsData
            .filter(s => {
                if (currentId && s.id === currentId) return false;
                if (currentNisn && s.nisn === currentNisn) return false;
                return true;
            })
            .map(s => ({
                ...s,
                _dist: NavigationModule.getDistanceKm(NavigationModule.userCoords[0], NavigationModule.userCoords[1], s.lat, s.lng)
            }))
            .sort((a, b) => a._dist - b._dist)
            .slice(0, 3);

        if (candidates.length === 0) {
            container.innerHTML = `
                <div style="background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:10px 12px; margin-bottom:10px; font-size:12px;">
                    <b>🔍 Belum Ada Rekomendasi</b><br>
                    <span style="color:#64748b; font-size:11px;">Tidak ditemukan teman di sekitar Anda saat ini.</span>
                </div>
            `;
            return;
        }

        let html = `<div style="font-size:11px; font-weight:700; color:#92400e; background:#fef3c7; padding:5px 10px; border-radius:6px; margin-bottom:6px;">🎯 Rekomendasi Teman Terdekat</div>`;
        candidates.forEach((s, i) => {
            html += `
                <div style="background:white; border:1px solid #fde68a; border-left:3px solid #f59e0b; border-radius:8px; padding:8px 10px; margin-bottom:6px; font-size:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <b>#${i+1} ${s.nama} (${s.kelas})</b>
                        <span style="background:#fef3c7; color:#92400e; font-size:10px; font-weight:700; padding:1px 5px; border-radius:4px;">📍 ${s._dist.toFixed(1)} km</span>
                    </div>
                    <div style="margin-top:6px; display:flex; gap:6px;">
                        <button class="btn btn-primary" style="font-size:10px; padding:4px 8px;" onclick="App.offerRideTo('${s.id}')">🚗 Ajak Berangkat</button>
                        <button class="btn btn-primary" style="background:#0284c7; font-size:10px; padding:4px 8px;" onclick="App.requestRide('${s.id}')">🙋 Minta Bareng</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        App.showToast(`🎯 Ditemukan ${candidates.length} teman terdekat!`);
    }
};

if (typeof window !== 'undefined') {
    window.RidesModule = RidesModule;
}
