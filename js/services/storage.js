/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - MANAJER PENYIMPANAN LOKAL (js/services/storage.js)
 * ==============================================================================
 */

const StorageManager = {
    KEYS: {
        SESSION: 'busbuddy_secure_session',
        STUDENTS: 'busbuddy_students_db',
        TEACHERS: 'busbuddy_teachers_db',
        REQUESTS: 'busbuddy_requests_db',
        SOS: 'busbuddy_sos_db',
        REMEMBER: 'busbuddy_remember_id'
    },

    // 1. Sesi Login Pengguna
    loadSession() {
        const raw = localStorage.getItem(this.KEYS.SESSION);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (_) {
            return null;
        }
    },

    saveSession(user) {
        if (user) {
            localStorage.setItem(this.KEYS.SESSION, JSON.stringify(user));
        } else {
            localStorage.removeItem(this.KEYS.SESSION);
        }
    },

    // 2. Data Koleksi (Siswa, Guru, Tebengan, SOS)
    loadCollection(key) {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    },

    saveCollection(key, data) {
        localStorage.setItem(key, JSON.stringify(data || []));
    },

    // 3. Fitur Ingat Saya (Remember Me)
    getRememberedID() {
        return localStorage.getItem(this.KEYS.REMEMBER) || '';
    },

    saveRememberedID(identifier, isChecked) {
        if (isChecked && identifier) {
            localStorage.setItem(this.KEYS.REMEMBER, identifier.trim());
        } else {
            localStorage.removeItem(this.KEYS.REMEMBER);
        }
    },

    // 4. Bersihkan Seluruh Cache
    clearAll() {
        localStorage.clear();
    }
};

if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}
