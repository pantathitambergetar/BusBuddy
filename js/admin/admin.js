/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - PANEL ADMINISTRATOR & DEVELOPER (js/admin/admin.js)
 * ==============================================================================
 */

const AdminModule = {
    // 1. Render Tampilan Panel Developer
    renderDeveloperTools() {
        const container = document.getElementById('developerContainer');
        if (!container) return;

        const totalSiswa = App.studentsData.length;
        const totalGuru = App.teachersData.length;
        const dbBadge = ApiService.isOnline
            ? '<span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:4px; font-weight:700; font-size:10px;">🟢 MySQL Aktif</span>'
            : '<span style="background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:4px; font-weight:700; font-size:10px;">🟡 MySQL Offline</span>';

        container.innerHTML = `
            <div style="background:#f5f3ff; border:1px solid #ddd6fe; border-radius:8px; padding:12px; margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <b style="color:#6d28d9; font-size:13px;">💻 Panel Administrator & Developer</b>
                    ${dbBadge}
                </div>
                <p style="font-size:11px; color:#64748b; margin-top:4px;">
                    Kelola data pengguna, sinkronisasi MySQL, dan kontrol penuh basis data BusBuddy.
                </p>
                <div style="display:flex; gap:10px; margin-top:8px; font-size:11px; font-weight:600;">
                    <span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:4px;">Total Siswa: ${totalSiswa}</span>
                    <span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:4px;">Total Guru: ${totalGuru}</span>
                </div>
            </div>

            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
                <button onclick="App.openDevAddUserModal()" class="btn btn-primary" style="background:#8b5cf6; font-size:11px;">
                    ➕ Tambah User Baru
                </button>
                <button onclick="App.importGoogleSheetStudents()" class="btn btn-primary" style="background:#0284c7; font-size:11px;" title="Muat 32 data siswa kelas XII-1 dari Google Sheets">
                    📥 Impor Siswa XII-1
                </button>
                <button onclick="App.migrateDataToMySQL()" class="btn btn-primary" style="background:#059669; font-size:11px;" title="Kirim seluruh data lokal ke MySQL">
                    🔄 Migrasikan ke MySQL
                </button>
                <button onclick="MapManager.simulateTripToSchool()" class="btn btn-secondary" style="font-size:11px;">
                    🚀 Tes Simulasi GPS
                </button>
            </div>

            <div style="font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">DAFTAR PENGGUNA TERDAFTAR:</div>
            <div style="max-height:280px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; background:white;">
                <table style="width:100%; border-collapse:collapse; font-size:11px; text-align:left;">
                    <thead>
                        <tr style="background:#f1f5f9; border-bottom:1px solid #e2e8f0; color:#475569;">
                            <th style="padding:6px 8px;">Peran</th>
                            <th style="padding:6px 8px;">Nama</th>
                            <th style="padding:6px 8px;">NISN / NIP</th>
                            <th style="padding:6px 8px; text-align:center;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Akun Developer (Pengguna Aktif) -->
                        <tr style="background:#faf5ff; border-bottom:1px solid #ede9fe;">
                            <td style="padding:6px 8px;"><span style="background:#8b5cf6; color:white; padding:1px 6px; border-radius:4px; font-size:9px; font-weight:700;">DEVELOPER</span></td>
                            <td style="padding:6px 8px;"><b>${AKUN_DEVELOPER.nama}</b> <span style="background:#dcfce7; color:#15803d; font-size:9px; padding:1px 5px; border-radius:4px; font-weight:700;">🟢 Aktif</span><br><span style="color:#64748b;">${AKUN_DEVELOPER.jabatan}</span></td>
                            <td style="padding:6px 8px; font-family:monospace; color:#6d28d9; font-weight:700;">${AKUN_DEVELOPER.username}</td>
                            <td style="padding:6px 8px; text-align:center; color:#64748b; font-size:10px;"><i>Akun Sistem</i></td>
                        </tr>
                        ${App.studentsData.map(s => {
                            const isMe = App.currentUser && (s.id === App.currentUser.id || s.nisn === App.currentUser.nisn);
                            return `
                            <tr style="border-bottom:1px solid #f1f5f9; ${isMe ? 'background:#f0fdf4;' : ''}">
                                <td style="padding:6px 8px;"><span style="background:#e0f2fe; color:#0369a1; padding:1px 6px; border-radius:4px; font-size:9px; font-weight:700;">SISWA</span></td>
                                <td style="padding:6px 8px;">
                                    <b>${s.nama}</b> ${isMe ? '<span style="background:#dcfce7; color:#15803d; font-size:9px; padding:1px 5px; border-radius:4px; font-weight:700;">🟢 Aktif</span>' : ''}<br>
                                    <span style="color:#64748b;">${s.kelas}</span>
                                </td>
                                <td style="padding:6px 8px; font-family:monospace;">${s.nisn}</td>
                                <td style="padding:6px 8px; text-align:center;">
                                    <button onclick="App.devDeleteUser('siswa', '${s.id}', '${s.nama}')" style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; padding:3px 6px; border-radius:4px; font-size:10px; cursor:pointer;" title="Hapus User">
                                        🗑️ Hapus
                                    </button>
                                </td>
                            </tr>
                            `;
                        }).join('')}
                        ${App.teachersData.map(g => {
                            const isMe = App.currentUser && (g.id === App.currentUser.id || g.nip === App.currentUser.nip);
                            return `
                            <tr style="border-bottom:1px solid #f1f5f9; ${isMe ? 'background:#f0fdf4;' : ''}">
                                <td style="padding:6px 8px;"><span style="background:#fef3c7; color:#b45309; padding:1px 6px; border-radius:4px; font-size:9px; font-weight:700;">GURU</span></td>
                                <td style="padding:6px 8px;">
                                    <b>${g.nama}</b> ${isMe ? '<span style="background:#dcfce7; color:#15803d; font-size:9px; padding:1px 5px; border-radius:4px; font-weight:700;">🟢 Aktif</span>' : ''}<br>
                                    <span style="color:#64748b;">${g.jabatan}</span>
                                </td>
                                <td style="padding:6px 8px; font-family:monospace;">${g.nip}</td>
                                <td style="padding:6px 8px; text-align:center;">
                                    <button onclick="App.devDeleteUser('guru', '${g.id}', '${g.nama}')" style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; padding:3px 6px; border-radius:4px; font-size:10px; cursor:pointer;" title="Hapus User">
                                        🗑️ Hapus
                                    </button>
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <button onclick="App.resetFactoryData()" class="btn btn-secondary" style="color:#dc2626; border-color:#fca5a5; margin-top:10px; width:100%; font-size:11px;">
                🔄 Reset Semua Data ke Default Pabrik
            </button>
        `;
    },

    // 2. Modal Tambah Pengguna Baru
    openModal() {
        const modal = document.getElementById('devAddUserModal');
        if (modal) modal.classList.add('active');
    },

    closeModal() {
        const modal = document.getElementById('devAddUserModal');
        if (modal) modal.classList.remove('active');
    },

    async submitAddUser(e) {
        if (e) e.preventDefault();

        const role = document.getElementById('devUserRole').value;
        const nama = SecurityUtil.sanitize(document.getElementById('devUserNama').value.trim());
        const idNumber = SecurityUtil.sanitize(document.getElementById('devUserIDNumber').value.trim());
        const extraInfo = SecurityUtil.sanitize(document.getElementById('devUserExtra').value.trim());

        if (!nama || !idNumber) {
            alert("Harap lengkapi Nama dan Nomor NISN/NIP!");
            return;
        }

        const autoPass = generatePasswordFromID(idNumber);
        const passHash = await SecurityUtil.hashPassword(autoPass);

        if (role === 'siswa') {
            const newStudent = {
                id: "SISWA-" + (App.studentsData.length + 1).toString().padStart(3, '0'),
                nisn: idNumber,
                nama: nama,
                kelas: extraInfo || "X-E 1",
                absen: Math.floor(Math.random() * 30) + 1,
                jenisKelamin: "Laki-laki",
                peran: "siswa",
                passwordHash: passHash,
                lat: -7.2588,
                lng: 112.7430,
                area: "Genteng Surabaya",
                rutePerjalanan: "Genteng -> SMAN 5",
                noWa: "",
                status: "tersedia"
            };
            App.studentsData.push(newStudent);
            StorageManager.saveCollection(StorageManager.KEYS.STUDENTS, App.studentsData);
            ApiService.saveStudent(newStudent);
            App.renderFriendsList();
        } else {
            const newTeacher = {
                id: "GURU-" + (App.teachersData.length + 1).toString().padStart(3, '0'),
                nip: idNumber,
                nama: nama,
                jabatan: extraInfo || "Guru Mata Pelajaran",
                jenisKelamin: "Laki-laki",
                peran: "guru",
                passwordHash: passHash,
                noWa: "",
                area: "Ruang Guru SMAN 5"
            };
            App.teachersData.push(newTeacher);
            StorageManager.saveCollection(StorageManager.KEYS.TEACHERS, App.teachersData);
            ApiService.saveTeacher(newTeacher);
        }

        this.closeModal();
        this.renderDeveloperTools();
        App.showToast(`✅ Pengguna baru ${nama} berhasil ditambahkan! Password: ${autoPass}`);
    },

    // 3. Hapus Pengguna
    devDeleteUser(role, id, nama) {
        if (!confirm(`Konfirmasi: Apakah Anda yakin ingin menghapus data ${nama} (${role.toUpperCase()})?`)) return;

        if (role === 'siswa') {
            App.studentsData = App.studentsData.filter(s => s.id !== id);
            StorageManager.saveCollection(StorageManager.KEYS.STUDENTS, App.studentsData);
            App.renderFriendsList();
            ApiService.deleteStudent(id);
        } else {
            App.teachersData = App.teachersData.filter(g => g.id !== id);
            StorageManager.saveCollection(StorageManager.KEYS.TEACHERS, App.teachersData);
            ApiService.deleteTeacher(id);
        }

        this.renderDeveloperTools();
        App.renderGuruDashboard();
        App.showToast(`🗑️ Data ${nama} berhasil dihapus.`);
    },

    // 4. Migrasi Data ke MySQL
    async migrateDataToMySQL() {
        App.showToast("⏳ Memeriksa koneksi database MySQL...");
        const isOnline = await ApiService.checkServer();
        if (!isOnline) {
            alert("⚠️ Server API / Database MySQL belum aktif!\n\nNyalakan MySQL di XAMPP lalu jalankan 'npm start' di folder server.");
            this.renderDeveloperTools();
            return;
        }

        const konfirmasi = confirm(`Kirim seluruh data (${App.studentsData.length} Siswa, ${App.teachersData.length} Guru) ke MySQL?`);
        if (!konfirmasi) return;

        App.showToast("⏳ Sedang memigrasikan data ke MySQL...");
        const res = await ApiService.importMigration(App.studentsData, App.teachersData, App.requestsData);
        if (res && res.success) {
            await ApiService.syncAll();
            App.renderAll();
            App.showToast("🎉 Seluruh data berhasil dimigrasikan ke MySQL!");
            alert(`🎉 MIGRASI KE MYSQL SELESAI!\n\n${res.message}`);
        } else {
            alert("❌ Gagal migrasi: " + (res ? res.message : 'Kesalahan jaringan'));
        }
    },

    // 5. Impor Data Google Sheets
    async importGoogleSheetStudents() {
        if (!App.currentUser || App.currentUser.peran !== 'developer') {
            App.showToast("⛔ Hanya Developer yang dapat mengimpor data!");
            return;
        }
        App.showToast("⏳ Sedang memuat 32 siswa kelas XII-1 dari Google Sheets...");
        const result = await ApiService.importGoogleSheetStudents();
        if (result && result.success && result.data) {
            App.studentsData = result.data;
            StorageManager.saveCollection(StorageManager.KEYS.STUDENTS, App.studentsData);
            App.renderFriendsList();
            this.renderDeveloperTools();
            const info = result.inMySQL ? 'Database MySQL & Browser' : 'Penyimpanan Mandiri (Lokal)';
            App.showToast(`🎉 ${result.count} siswa kelas XII-1 berhasil ditampilkan di peta!`);
            alert(`🎉 IMPOR SELESAI!\n\nSebanyak ${result.count} siswa kelas XII-1 berhasil dimasukkan ke sistem (${info}).`);
        } else {
            alert("❌ Gagal memuat data siswa: " + (result ? result.message : 'Kesalahan koneksi'));
        }
    },

    // 6. Reset Pabrik
    resetFactoryData() {
        if (!confirm("⚠️ PERINGATAN: Seluruh data siswa dan guru akan dihapus bersih. Lanjutkan?")) return;
        StorageManager.clearAll();
        App.studentsData = [];
        App.teachersData = [];
        App.requestsData = [];
        App.sosAlerts = [];
        App.currentUser = null;
        App.checkAuthStatus();
        App.renderAll();
        App.showToast("🔄 Seluruh data berhasil direset ke setelan awal.");
    }
};

if (typeof window !== 'undefined') {
    window.AdminModule = AdminModule;
}
