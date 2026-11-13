/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - API SERVICE JARINGAN & POSTGRESQL (js/services/api.js)
 * ==============================================================================
 */

const ApiService = {
    BASE_URL: (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) 
        ? `${window.location.origin}/api` 
        : 'http://localhost:3000/api',
    isOnline: false,

    // Cek koneksi ke server backend
    async checkServer() {
        try {
            const res = await fetch(`${this.BASE_URL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            const data = await res.json();
            this.isOnline = data.success === true;
        } catch {
            this.isOnline = false;
        }

        if (this.isOnline) {
            console.log('🟢 BusBuddy API Server terhubung — Mode Database PostgreSQL aktif');
        } else {
            console.warn('🟡 API Server offline — Mode Penyimpanan Mandiri (Lokal)');
        }
        return this.isOnline;
    },

    async _fetch(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        try {
            const res = await fetch(url, {
                ...options,
                headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
            });
            return await res.json();
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    // 1. Data Siswa
    async getStudents() {
        if (!this.isOnline) return null;
        const res = await this._fetch('/students');
        if (res.success && res.data) {
            StorageManager.saveCollection(StorageManager.KEYS.STUDENTS, res.data);
            return res.data;
        }
        return null;
    },

    async saveStudent(student) {
        if (!this.isOnline) await this.checkServer();
        if (!this.isOnline) return { success: false, message: 'Server offline' };
        return await this._fetch('/students', {
            method: 'POST',
            body: JSON.stringify(student)
        });
    },

    async deleteStudent(id) {
        if (!this.isOnline) await this.checkServer();
        if (!this.isOnline) return false;
        const res = await this._fetch(`/students/${id}`, { method: 'DELETE' });
        return res && res.success;
    },

    // 2. Data Guru
    async getTeachers() {
        if (!this.isOnline) return null;
        const res = await this._fetch('/teachers');
        if (res.success && res.data) {
            StorageManager.saveCollection(StorageManager.KEYS.TEACHERS, res.data);
            return res.data;
        }
        return null;
    },

    async saveTeacher(teacher) {
        if (!this.isOnline) await this.checkServer();
        if (!this.isOnline) return { success: false, message: 'Server offline' };
        return await this._fetch('/teachers', {
            method: 'POST',
            body: JSON.stringify(teacher)
        });
    },

    async deleteTeacher(id) {
        if (!this.isOnline) await this.checkServer();
        if (!this.isOnline) return false;
        const res = await this._fetch(`/teachers/${id}`, { method: 'DELETE' });
        return res && res.success;
    },

    // 3. Permintaan Tebengan
    async getRequests() {
        if (!this.isOnline) return null;
        const res = await this._fetch('/requests');
        if (res.success && res.data) {
            StorageManager.saveCollection(StorageManager.KEYS.REQUESTS, res.data);
            return res.data;
        }
        return null;
    },

    async saveRequest(req) {
        if (!this.isOnline) return false;
        const res = await this._fetch('/requests', {
            method: 'POST',
            body: JSON.stringify(req)
        });
        return res.success;
    },

    // 4. Autentikasi Langsung ke MySQL
    async login(identifier, password) {
        if (!this.isOnline) return null;
        return await this._fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password })
        });
    },

    // 5. Migrasi & Sinkronisasi
    async importMigration(students, teachers, requests) {
        if (!this.isOnline) return { success: false, message: 'Server offline' };
        return await this._fetch('/migrate/import', {
            method: 'POST',
            body: JSON.stringify({ students, teachers, requests })
        });
    },

    async importGoogleSheetStudents() {
        if (this.isOnline) {
            const res = await this._fetch('/students/import-sheet', { method: 'POST' });
            if (res.success && res.data) {
                StorageManager.saveCollection(StorageManager.KEYS.STUDENTS, res.data);
                return { success: true, count: res.data.length, data: res.data, inMySQL: true };
            }
        }
        try {
            const res = await fetch('server/students_xii_1.json');
            if (res.ok) {
                const data = await res.json();
                StorageManager.saveCollection(StorageManager.KEYS.STUDENTS, data);
                return { success: true, count: data.length, data: data, inMySQL: false };
            }
        } catch (e) {
            console.warn('Fallback JSON fetch failed:', e);
        }
        return { success: false, message: 'Gagal memuat file students_xii_1.json.' };
    },

    async syncAll() {
        if (!this.isOnline) await this.checkServer();
        if (!this.isOnline) return;
        const [students, teachers, requests] = await Promise.all([
            this.getStudents(),
            this.getTeachers(),
            this.getRequests()
        ]);
        if (window.App) {
            if (students !== null) {
                window.App.studentsData = students;
                StorageManager.saveCollection(StorageManager.KEYS.STUDENTS, students);
            }
            if (teachers !== null) {
                window.App.teachersData = teachers;
                StorageManager.saveCollection(StorageManager.KEYS.TEACHERS, teachers);
            }
            if (requests !== null) {
                window.App.requestsData = requests;
                StorageManager.saveCollection(StorageManager.KEYS.REQUESTS, requests);
            }
        }
        return { students, teachers, requests };
    }
};

if (typeof window !== 'undefined') {
    window.ApiService = ApiService;
}
