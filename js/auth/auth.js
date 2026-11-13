/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - MODUL AUTENTIKASI & REGISTRASI (js/auth/auth.js)
 * ==============================================================================
 */

const AuthModule = {
    currentCaptchaAnswer: null,

    // 1. Ganti Tab (Login vs Daftar)
    switchAuthTab(tabName) {
        document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.auth-panel').forEach(panel => panel.style.display = 'none');
        const activeBtn = document.getElementById(`authTabBtn_${tabName}`);
        const activePanel = document.getElementById(`authPanel_${tabName}`);
        if (activeBtn) activeBtn.classList.add('active');
        if (activePanel) activePanel.style.display = 'block';
        if (tabName === 'daftar') this.generateNewCaptcha();
    },

    // 2. Perubahan Form Pendaftaran Siswa vs Guru
    onRegRoleChange(role) {
        const rowSiswa = document.getElementById('rowSiswaFields');
        const rowGuru = document.getElementById('rowGuruFields');
        const idLabel = document.getElementById('labelRegIdentifier');
        const idInput = document.getElementById('regIdentifier');

        if (role === 'siswa') {
            if (rowSiswa) rowSiswa.style.display = 'grid';
            if (rowGuru) rowGuru.style.display = 'none';
            if (idLabel) idLabel.innerText = "Nomor Induk Siswa Nasional (NISN):";
            if (idInput) idInput.placeholder = "Contoh: 0061234567";
        } else {
            if (rowSiswa) rowSiswa.style.display = 'none';
            if (rowGuru) rowGuru.style.display = 'block';
            if (idLabel) idLabel.innerText = "Nomor Induk Pegawai (NIP):";
            if (idInput) idInput.placeholder = "Contoh: 19800512001";
        }
        if (idInput) this.onRegIdentifierChange(idInput.value);
    },

    // 3. Petunjuk Password Otomatis Saat Mengetik
    onLoginIdentifierChange(val) {
        const hintEl = document.getElementById('loginPassHint');
        if (!hintEl) return;
        const clean = (val || '').trim();
        if (clean.toLowerCase() === 'developer') {
            hintEl.innerHTML = `💻 <i>Akses Administrator: Masukkan kata sandi master developer</i>`;
        } else if (clean.length >= 5) {
            hintEl.innerHTML = `💡 Password: <b style="color:#2563eb; background:#eff6ff; padding:2px 6px; border-radius:4px;">${generatePasswordFromID(clean)}</b>`;
        } else {
            hintEl.innerHTML = `<i>Format password: <b>smala</b> + 5 digit terakhir nomor identitas</i>`;
        }
    },

    onRegIdentifierChange(val) {
        const hintEl = document.getElementById('regPassPreview');
        if (!hintEl) return;
        const clean = (val || '').trim();
        if (clean.length >= 5) {
            hintEl.innerHTML = `🔑 Password otomatis: <b style="color:#059669;">${generatePasswordFromID(clean)}</b>`;
        } else {
            hintEl.innerHTML = `<i>Masukkan minimal 5 digit nomor identitas</i>`;
        }
    },

    // 4. Captcha Anti-Bot
    generateNewCaptcha() {
        const n1 = Math.floor(Math.random() * 8) + 2;
        const n2 = Math.floor(Math.random() * 8) + 1;
        this.currentCaptchaAnswer = n1 + n2;
        const captchaBox = document.getElementById('captchaQuestion');
        if (captchaBox) captchaBox.innerText = `Berapa hasil dari ${n1} + ${n2} ?`;
        const captchaInput = document.getElementById('regCaptchaInput');
        if (captchaInput) captchaInput.value = '';
    },

    // 5. Proses Login Terpadu (Siswa, Guru, Developer)
    async handleLogin(e) {
        if (e) e.preventDefault();
        let identifier = document.getElementById('loginIdentifier').value.trim();
        let password = document.getElementById('loginPassword').value.trim();
        const rememberMe = document.getElementById('rememberMeCheckbox').checked;

        if (SecurityUtil.detectSqlInjection(identifier) || SecurityUtil.detectSqlInjection(password)) {
            alert("🚨 Peringatan Keamanan: Terdeteksi pola input mencurigakan (SQL Injection).");
            return;
        }

        identifier = SecurityUtil.sanitize(identifier);
        password = SecurityUtil.sanitize(password);
        if (!identifier || !password) {
            alert("Harap masukkan Nomor Identitas / Username dan Kata Sandi.");
            return;
        }

        // A. Akun Developer
        if (identifier.toLowerCase() === AKUN_DEVELOPER.username.toLowerCase() || identifier === AKUN_DEVELOPER.id) {
            if (password === AKUN_DEVELOPER.masterPassword) {
                App.currentUser = { ...AKUN_DEVELOPER };
                StorageManager.saveSession(App.currentUser);
                App.checkAuthStatus();
                NavigationModule.setUserLocation(SEKOLAH_DATA.lat, SEKOLAH_DATA.lng, 'Developer (SMAN 5)');
                if (MapView.map) MapView.map.setView([SEKOLAH_DATA.lat, SEKOLAH_DATA.lng], 15);
                App.renderAll();
                App.showToast("💻 Mode Developer Aktif!");
                return;
            }
            alert("❌ Kata sandi Developer salah!");
            return;
        }

        // B. Cek Format Password Sekolah
        const expectedPassword = generatePasswordFromID(identifier);
        if (password !== expectedPassword) {
            alert(`❌ Kata sandi tidak sesuai!\nFormat: "smala" + 5 digit terakhir nomor identitas.\nContoh: ${expectedPassword}`);
            return;
        }

        // C. Cari di Database MySQL (Online) atau Cache Lokal
        let matchedUser = null;
        if (ApiService.isOnline) {
            const apiRes = await ApiService.login(identifier, password);
            if (apiRes && apiRes.success && apiRes.user) {
                matchedUser = apiRes.user;
                if (matchedUser.peran === 'siswa' && !App.studentsData.some(s => s.nisn === matchedUser.nisn)) {
                    App.studentsData.push(matchedUser);
                    StorageManager.saveCollection(StorageManager.KEYS.STUDENTS, App.studentsData);
                } else if (matchedUser.peran === 'guru' && !App.teachersData.some(g => g.nip === matchedUser.nip)) {
                    App.teachersData.push(matchedUser);
                    StorageManager.saveCollection(StorageManager.KEYS.TEACHERS, App.teachersData);
                }
            } else if (apiRes && !apiRes.success && apiRes.code !== 'NOT_FOUND') {
                alert(`❌ ${apiRes.message}`);
                return;
            }
        }

        if (!matchedUser) {
            matchedUser = App.studentsData.find(s => s.nisn === identifier) || App.teachersData.find(g => g.nip === identifier);
        }

        if (!matchedUser) {
            const daftar = confirm(`Nomor Identitas ${identifier} belum terdaftar di sistem BusBuddy.\n\nApakah Anda ingin mendaftarkan akun baru?`);
            if (daftar) {
                this.switchAuthTab('daftar');
                const regId = document.getElementById('regIdentifier');
                if (regId) {
                    regId.value = identifier;
                    this.onRegIdentifierChange(identifier);
                }
            }
            return;
        }

        matchedUser.status = 'online';
        if (ApiService.isOnline && matchedUser.peran === 'siswa') {
            ApiService._fetch(`/students/${matchedUser.id}`, { method: 'PUT', body: JSON.stringify({ status: 'online' }) }).catch(() => {});
        }
        StorageManager.saveRememberedID(identifier, rememberMe);
        App.currentUser = { ...matchedUser };
        StorageManager.saveSession(App.currentUser);
        App.checkAuthStatus();
        const uLat = parseFloat(App.currentUser.lat) || SEKOLAH_DATA.lat;
        const uLng = parseFloat(App.currentUser.lng) || SEKOLAH_DATA.lng;
        NavigationModule.setUserLocation(uLat, uLng, `Lokasi Anda (${App.currentUser.nama})`);
        NavigationModule.startGPS();
        if (MapView.map) MapView.map.setView([uLat, uLng], 15);
        if (ApiService.isOnline) await ApiService.syncAll();
        App.renderAll();
        App.showToast(`🎉 Login Berhasil! Selamat datang, ${App.currentUser.nama}.`);
    },

    // 6. Proses Pendaftaran Siswa & Guru
    async handleRegistration(e) {
        if (e) e.preventDefault();

        // Honeypot & Captcha
        if (document.getElementById('regHoneypot').value.trim() !== "") {
            alert("Pendaftaran ditolak oleh sistem keamanan.");
            return;
        }
        const userCaptcha = parseInt(document.getElementById('regCaptchaInput').value.trim());
        if (userCaptcha !== this.currentCaptchaAnswer) {
            alert("❌ Jawaban Captcha salah. Silakan coba kembali.");
            this.generateNewCaptcha();
            return;
        }

        const peran = document.getElementById('regPeran').value;
        let nama = SecurityUtil.sanitize(document.getElementById('regNama').value.trim());
        let idNumber = SecurityUtil.sanitize(document.getElementById('regIdentifier').value.trim());
        let gender = document.getElementById('regGender').value;
        let noWa = SecurityUtil.sanitize(document.getElementById('regWa').value.trim()) || '6281299998888';

        if (!nama || !idNumber) {
            alert("Harap lengkapi Nama dan Nomor Identitas.");
            return;
        }
        if (!SecurityUtil.validateNumeric(idNumber, 5)) {
            alert("Nomor Identitas harus berupa angka minimal 5 digit!");
            return;
        }

        const autoPass = generatePasswordFromID(idNumber);
        const passHash = await SecurityUtil.hashPassword(autoPass);

        if (peran === 'siswa') {
            let kelas = SecurityUtil.sanitize(document.getElementById('regKelas').value.trim()) || 'X-E 1';
            let absen = parseInt(SecurityUtil.sanitize(document.getElementById('regAbsen').value.trim())) || 1;
            if (App.studentsData.some(s => s.nisn === idNumber)) {
                alert(`NISN ${idNumber} sudah terdaftar! Silakan login di tab Masuk.`);
                this.switchAuthTab('login');
                return;
            }
            const uniqueId = "SISWA-" + Date.now().toString().slice(-4) + Math.floor(Math.random() * 90 + 10);
            const newStudent = {
                id: uniqueId,
                nisn: idNumber, nama, kelas, absen, jenisKelamin: gender,
                peran: "siswa", passwordHash: passHash,
                lat: -7.2588, lng: 112.7430, area: "Genteng Surabaya",
                rutePerjalanan: "Kawasan Pusat -> SMAN 5", noWa, status: "tersedia"
            };
            const saveRes = await ApiService.saveStudent(newStudent);
            if (saveRes && saveRes.success && saveRes.data && saveRes.data.id) {
                newStudent.id = saveRes.data.id;
            }
            App.studentsData.push(newStudent);
            StorageManager.saveCollection(StorageManager.KEYS.STUDENTS, App.studentsData);
            alert(`🎉 PENDAFTARAN BERHASIL!\n\nNama: ${nama}\nNISN: ${idNumber}\n🔑 PASSWORD: ${autoPass}`);
            App.currentUser = { ...newStudent };
        } else {
            let jabatan = SecurityUtil.sanitize(document.getElementById('regJabatan').value.trim()) || 'Guru SMAN 5 Surabaya';
            if (App.teachersData.some(g => g.nip === idNumber)) {
                alert(`NIP ${idNumber} sudah terdaftar! Silakan login di tab Masuk.`);
                this.switchAuthTab('login');
                return;
            }
            const uniqueId = "GURU-" + Date.now().toString().slice(-4) + Math.floor(Math.random() * 90 + 10);
            const newTeacher = {
                id: uniqueId,
                nip: idNumber, nama, jabatan, jenisKelamin: gender,
                peran: "guru", passwordHash: passHash, noWa,
                area: "Ruang Guru SMAN 5 Surabaya"
            };
            const saveRes = await ApiService.saveTeacher(newTeacher);
            if (saveRes && saveRes.success && saveRes.data && saveRes.data.id) {
                newTeacher.id = saveRes.data.id;
            }
            App.teachersData.push(newTeacher);
            StorageManager.saveCollection(StorageManager.KEYS.TEACHERS, App.teachersData);
            alert(`🎉 PENDAFTARAN GURU BERHASIL!\n\nNama: ${nama}\nNIP: ${idNumber}\n🔑 PASSWORD: ${autoPass}`);
            App.currentUser = { ...newTeacher };
        }

        StorageManager.saveSession(App.currentUser);
        App.checkAuthStatus();
        const regLat = parseFloat(App.currentUser.lat) || SEKOLAH_DATA.lat;
        const regLng = parseFloat(App.currentUser.lng) || SEKOLAH_DATA.lng;
        NavigationModule.setUserLocation(regLat, regLng, `Lokasi Anda (${App.currentUser.nama})`);
        NavigationModule.startGPS();
        if (MapView.map) MapView.map.setView([regLat, regLng], 15);
        await ApiService.syncAll();
        App.renderAll();
        App.showToast(`🎉 Selamat datang di BusBuddy, ${App.currentUser.nama}!`);
    },

    // 7. Logout
    async logout() {
        if (!confirm("Apakah Anda yakin ingin keluar dari akun?")) return;
        const oldUser = App.currentUser;
        if (oldUser && oldUser.peran === 'siswa' && ApiService.isOnline) {
            await ApiService._fetch(`/students/${oldUser.id}`, { method: 'PUT', body: JSON.stringify({ status: 'offline' }) }).catch(() => {});
        }
        NavigationModule.stopGPS();
        App.currentUser = null;
        StorageManager.saveSession(null);
        App.checkAuthStatus();
        App.checkRememberMe();
        if (ApiService.isOnline) await ApiService.syncAll();
        App.renderAll();
        App.showToast("🚪 Anda telah keluar dari sistem (Status Offline).");
    }
};

if (typeof window !== 'undefined') {
    window.AuthModule = AuthModule;
}
