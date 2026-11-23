/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - TEMPLATE PESAN WHATSAPP (lib/whatsappTemplates.js)
 * Template otomatis untuk Minta Nebeng, Persetujuan, dan Akhiri Perjalanan
 * ==============================================================================
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WhatsappTemplates = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    // Format nomor WhatsApp: Ubah 08xx atau 8xx menjadi format internasional 628xx
    function formatWaNumber(phone) {
        if (!phone) return '';
        let clean = phone.toString().replace(/\D/g, '');
        if (clean.startsWith('08')) {
            clean = '628' + clean.slice(2);
        } else if (clean.startsWith('8')) {
            clean = '628' + clean.slice(1);
        } else if (!clean.startsWith('62') && clean.length > 0) {
            clean = '62' + clean;
        }
        return clean;
    }

    // Dapatkan URL dasar aplikasi saat ini
    function getAppUrl() {
        if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) {
            return window.location.origin;
        }
        return 'https://bus-buddy-steel.vercel.app';
    }

    // 1a. Template Minta Nebeng (dikirim A ke B)
    // Format: "Halo [Nama B], aku [Nama A] mau nebeng sama kamu besok jam [Jam] dari [Titik Jemput]. Mau terima? Klik link ini buat jawab ya: {APP_URL}/nebeng/[id]"
    function templateMintaNebeng(params) {
        const p = params || {};
        const namaB = p.namaB || 'Teman';
        const namaA = p.namaA || 'Teman SMAN 5';
        const jam = p.jam || '06:30 WIB';
        const titikJemput = p.titikJemput || 'Kawasan SMAN 5';
        const id = p.id || '';
        const appUrl = (p.appUrl || getAppUrl()).replace(/\/+$/, '');

        return `Halo ${namaB}, aku ${namaA} mau nebeng sama kamu besok jam ${jam} dari ${titikJemput}. Mau terima? Klik link ini buat jawab ya: ${appUrl}/nebeng/${id}`;
    }

    // 1b. Template Ajak Berangkat (dikirim A ke B saat ajak nebeng)
    function templateAjakNebeng(params) {
        const p = params || {};
        const namaB = p.namaB || 'Teman';
        const namaA = p.namaA || 'Teman SMAN 5';
        const jam = p.jam || '06:30 WIB';
        const titikJemput = p.titikJemput || 'Kawasan SMAN 5';
        const id = p.id || '';
        const appUrl = (p.appUrl || getAppUrl()).replace(/\/+$/, '');

        return `Halo ${namaB}, aku ${namaA} mau ajak kamu berangkat bareng besok jam ${jam} dari ${titikJemput}. Mau terima? Klik link ini buat jawab ya: ${appUrl}/nebeng/${id}`;
    }

    // 2. Template Diterima (dikirim B ke A setelah klik Terima)
    // Format: "Halo [Nama A], tebengan kamu aku terima! Berangkat jam [Jam] ya. Cek di web: {APP_URL}/status-saya"
    function templateDiterima(params) {
        const p = params || {};
        const namaA = p.namaA || 'Teman';
        const jam = p.jam || '06:30 WIB';
        const appUrl = (p.appUrl || getAppUrl()).replace(/\/+$/, '');

        return `Halo ${namaA}, tebengan kamu aku terima! Berangkat jam ${jam} ya. Cek di web: ${appUrl}/status-saya`;
    }

    // 3. Template Akhiri Nebeng (dikirim ke lawan setelah selesai)
    // Format: "Halo, nebeng kita sudah selesai. Terima kasih sudah nebeng bareng! - [Nama Pengirim]"
    function templateAkhiriNebeng(params) {
        const p = params || {};
        const namaPengirim = p.namaPengirim || 'Teman SMAN 5';

        return `Halo, nebeng kita sudah selesai. Terima kasih sudah nebeng bareng! - ${namaPengirim}`;
    }

    // Helper membuat tautan wa.me lengkap dengan teks yang di-encode
    function createWaLink(phone, messageText) {
        const cleanPhone = formatWaNumber(phone);
        const encodedText = encodeURIComponent(messageText || '');
        return `https://wa.me/${cleanPhone}?text=${encodedText}`;
    }

    return {
        formatWaNumber: formatWaNumber,
        getAppUrl: getAppUrl,
        templateMintaNebeng: templateMintaNebeng,
        templateAjakNebeng: templateAjakNebeng,
        templateDiterima: templateDiterima,
        templateAkhiriNebeng: templateAkhiriNebeng,
        createWaLink: createWaLink
    };
}));
