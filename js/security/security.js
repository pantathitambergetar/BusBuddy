/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - KEAMANAN SIBER & PROTEKSI INPUT (js/security/security.js)
 * ==============================================================================
 */

const SecurityUtil = {
    // 1. Sanitasi Input: Melindungi dari SQL Injection & Cross-Site Scripting (XSS)
    sanitize(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/['";\\]/g, '')           // Hapus karakter pemutus string SQL
            .replace(/--/g, '')                 // Hapus penanda komentar SQL
            .replace(/\/\*[\s\S]*?\*\//g, '')   // Hapus komentar multi-line
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Mencegah script execution
            .replace(/[<>]/g, '')               // Hapus kurung sudut HTML
            .trim();
    },

    // 2. Deteksi Pola Serangan SQL Injection Umum
    detectSqlInjection(input) {
        if (typeof input !== 'string') return false;
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/i,
            /('|\b)(OR|AND)\b.+(=|<|>)/i,
            /--/,
            /\/\*/,
            /(\bOR\b|\bAND\b)\s+1=1/i
        ];
        return sqlPatterns.some(pattern => pattern.test(input));
    },

    // 3. Validasi Angka Ketat (Untuk NISN & NIP)
    validateNumeric(val, minLen = 5) {
        const cleaned = (val || '').toString().trim();
        return /^\d+$/.test(cleaned) && cleaned.length >= minLen;
    },

    // 4. Enkripsi Kata Sandi Hash SHA-256 (Keamanan Data Pribadi Siswa & Guru)
    async hashPassword(password, salt = "smala_salt_2026") {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + salt);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        }
        // Fallback untuk lingkungan Node.js atau browser lawas
        try {
            const cryptoNode = require('crypto');
            return cryptoNode.createHash('sha256').update(password + salt).digest('hex');
        } catch (_) {
            return btoa(password + salt);
        }
    }
};

// 5. Generator Password Standar Sekolah: "smala" + 5 digit terakhir Nomor Identitas
function generatePasswordFromID(idNumber) {
    const cleanID = (idNumber || '').toString().trim();
    if (cleanID.length < 5) return "smala" + cleanID;
    return "smala" + cleanID.slice(-5);
}

if (typeof window !== 'undefined') {
    window.SecurityUtil = SecurityUtil;
    window.generatePasswordFromID = generatePasswordFromID;
}
