/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - PENGATUR UTAMA APLIKASI (js/main/app.js)
 * ==============================================================================
 */

const App = {
    currentUser: null,
    activeTab: 'tabTeman',
    filterPeran: 'all',
    filterJarakKm: null,
    studentsData: [],
    teachersData: [],
    requestsData: [],
    sosAlerts: [],

    // 1. Inisialisasi Aplikasi Saat Halaman Dibuka
    async init() {
        // Muat data dari penyimpanan lokal
        this.currentUser = StorageManager.loadSession();
        this.studentsData = StorageManager.loadCollection(StorageManager.KEYS.STUDENTS);
        this.teachersData = StorageManager.loadCollection(StorageManager.KEYS.TEACHERS);
        this.requestsData = StorageManager.loadCollection(StorageManager.KEYS.REQUESTS);
        this.sosAlerts = StorageManager.loadCollection(StorageManager.KEYS.SOS);

        this.setupEventListeners();
        AuthModule.generateNewCaptcha();
        this.checkRememberMe();
        this.checkAuthStatus();

        // Inisialisasi Peta
        MapManager.init();

        // Tampilkan penanda posisi pengguna aktif di peta
        if (this.currentUser) {
            const uLat = parseFloat(this.currentUser.lat) || SEKOLAH_DATA.lat;
            const uLng = parseFloat(this.currentUser.lng) || SEKOLAH_DATA.lng;
            NavigationModule.setUserLocation(uLat, uLng, `Lokasi Anda (${this.currentUser.nama})`);
            NavigationModule.startGPS();
        } else {
            NavigationModule.startGPS();
        }

        // Sinkronisasi data dari MySQL/PostgreSQL jika server online
        const online = await ApiService.checkServer();
        if (online) {
            await ApiService.syncAll();
            console.log("📊 Data berhasil disinkronkan dari database.");
        }

        // Render seluruh tampilan
        this.renderAll();
        console.log("🚌 BusBuddy SMAN 5 Surabaya siap digunakan.");
    },

    // 2. Render Seluruh Komponen Layar
    renderAll() {
        this.renderFriendsList();
        this.renderTransportList();
        this.renderGuruDashboard();
        this.renderDeveloperTools();
        this.renderEmergencyContacts();
    },

    // 3. Status Login & Header Profil
    checkAuthStatus() {
        const gatekeeper = document.getElementById('authGatekeeper');
        if (!gatekeeper) return;

        if (!this.currentUser) {
            gatekeeper.style.display = 'flex';
        } else {
            gatekeeper.style.display = 'none';
            this.renderUserBadge();
            this.updateRoleVisibility();
        }
    },

    renderUserBadge() {
        const badge = document.getElementById('userRoleBadge');
        if (!badge || !this.currentUser) return;

        let roleLabel = 'Siswa SMAN 5';
        let dotColor = '#0284c7';
        if (this.currentUser.peran === 'guru') {
            roleLabel = 'Guru SMAN 5';
            dotColor = '#d97706';
        } else if (this.currentUser.peran === 'developer') {
            roleLabel = 'Developer / Admin';
            dotColor = '#8b5cf6';
        }

        const id = this.currentUser.nisn || this.currentUser.nip || this.currentUser.username || '-';
        badge.innerHTML = `
            <span class="dot" style="background-color:${dotColor}"></span>
            <span class="badge-user-name" title="${this.currentUser.nama}"><b>${this.currentUser.nama}</b></span>
            <span class="badge-user-role" style="color:#475569; font-size:11px;">(${roleLabel})</span>
            <span class="badge-user-id" style="font-size:10px; color:#64748b; margin-left:4px;">[ID: ${id}]</span>
        `;
    },

    updateRoleVisibility() {
        if (!this.currentUser) return;
        const role = this.currentUser.peran;
        const btnGuru = document.getElementById('tabBtnGuru');
        const btnDev = document.getElementById('tabBtnDeveloper');
        if (btnGuru) btnGuru.style.display = (role === 'guru' || role === 'developer') ? 'flex' : 'none';
        if (btnDev) btnDev.style.display = (role === 'developer') ? 'flex' : 'none';
    },

    checkRememberMe() {
        const rememberedID = StorageManager.getRememberedID();
        const inputID = document.getElementById('loginIdentifier');
        const checkbox = document.getElementById('rememberMeCheckbox');
        if (rememberedID && inputID) {
            inputID.value = rememberedID;
            AuthModule.onLoginIdentifierChange(rememberedID);
            if (checkbox) checkbox.checked = true;
        }
    },

    // 4. Notifikasi Toast Mengambang
    showToast(message) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>💬</span><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    // 5. Event Listeners untuk Tab Sidebar & Filter
    setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const target = document.getElementById(btn.dataset.tab);
                if (target) target.classList.add('active');
                if (ApiService.isOnline) {
                    await ApiService.syncAll();
                }
                this.renderAll();
            });
        });

        document.querySelectorAll('[data-filter-distance]').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('[data-filter-distance]').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const val = chip.dataset.filterDistance;
                this.filterJarakKm = val === 'all' ? null : parseFloat(val);
                this.renderFriendsList();
            });
        });
    },

    onUserLocationFound(lat, lng) {
        this.renderFriendsList();
    },

    // 6. Delegator Metode (Kompatibilitas Penuh OnClick HTML)
    switchAuthTab(tab) { AuthModule.switchAuthTab(tab); },
    onRegRoleChange(role) { AuthModule.onRegRoleChange(role); },
    onLoginIdentifierChange(val) { AuthModule.onLoginIdentifierChange(val); },
    onRegIdentifierChange(val) { AuthModule.onRegIdentifierChange(val); },
    generateNewCaptcha() { AuthModule.generateNewCaptcha(); },
    handleUnifiedLogin(e) { AuthModule.handleLogin(e); },
    handleUnifiedRegistration(e) { AuthModule.handleRegistration(e); },
    logout() { AuthModule.logout(); },

    renderFriendsList() { RidesModule.renderFriendsList(); },
    renderUserRideStatus() { RidesModule.renderUserRideStatus(); },
    searchNearestRide() { RidesModule.searchNearestRide(); },
    requestRide(id) { RidesModule.requestRide(id); },
    offerRideTo(id) { RidesModule.offerRideTo(id); },
    openWhatsAppChat(id) { RidesModule.openWhatsAppChat(id); },

    renderDeveloperTools() { AdminModule.renderDeveloperTools(); },
    openDevAddUserModal() { AdminModule.openModal(); },
    closeDevAddUserModal() { AdminModule.closeModal(); },
    submitDevAddUser(e) { AdminModule.submitAddUser(e); },
    devDeleteUser(role, id, nama) { AdminModule.devDeleteUser(role, id, nama); },
    migrateDataToMySQL() { AdminModule.migrateDataToMySQL(); },
    importGoogleSheetStudents() { AdminModule.importGoogleSheetStudents(); },
    resetFactoryData() { AdminModule.resetFactoryData(); },

    renderGuruDashboard() { DashboardModule.renderGuruDashboard(); },
    renderTransportList() { DashboardModule.renderTransportList(); },

    triggerSOSModal() { EmergencyModule.triggerModal(); },
    closeSOSModal() { EmergencyModule.closeModal(); },
    sendSosWhatsApp(num) { EmergencyModule.sendWhatsApp(num); },
    copyLocationLink() { EmergencyModule.copyLink(); },
    renderEmergencyContacts() { EmergencyModule.renderContacts(); }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

if (typeof window !== 'undefined') {
    window.App = App;
}
