/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - KONFIGURASI & DATA MASTER (js/config/constants.js)
 * ==============================================================================
 */

// 1. Titik Lokasi Resmi SMAN 5 Surabaya (Tujuan Akhir)
const SEKOLAH_DATA = {
    nama: "SMAN 5 Surabaya",
    alamat: "Jl. Kusuma Bangsa No.21, Ketabang, Kec. Genteng, Surabaya",
    lat: -7.25747,
    lng: 112.75023
};

// 2. Kredensial Administrator / Developer Sistem
const AKUN_DEVELOPER = {
    id: "DEV-001",
    username: "developer",
    nama: "Tim IT Developer BusBuddy SMAN 5",
    jabatan: "Administrator Sistem",
    peran: "developer",
    masterPassword: "smaladev2026",
    noWa: ""
};

// 3. Titik Transportasi Publik Sekitar SMAN 5 Surabaya
const TRANSPORTASI_UMUM = [
    {
        id: "TP-01",
        tipe: "feeder",
        nama: "Halte Feeder SMAN 5 / Kusuma Bangsa",
        trayek: "FD01 (Terminal Joyoboyo - Kenjeran Park)",
        lat: -7.2570,
        lng: 112.7506
    },
    {
        id: "TP-02",
        tipe: "feeder",
        nama: "Halte Feeder Grand City Mall",
        trayek: "FD07 & FD01",
        lat: -7.2618,
        lng: 112.7525
    },
    {
        id: "TP-03",
        tipe: "bus",
        nama: "Halte Suroboyo Bus Pemuda / Monkasel",
        trayek: "Koridor 1 (Terminal Purabaya - Rajawali)",
        lat: -7.2655,
        lng: 112.7460
    },
    {
        id: "TP-04",
        tipe: "kereta",
        nama: "Stasiun Kereta Surabaya Gubeng",
        trayek: "Komuter Sidoarjo - Surabaya - Indro / Lamongan",
        lat: -7.26532,
        lng: 112.75269
    }
];

// 4. Kontak Darurat Resmi SMAN 5 Surabaya & Pemkot
// CATATAN: Isi kontak ini dikelola langsung oleh pihak sekolah.
// Data diisi oleh admin/developer melalui database, bukan hardcode di sini.
const KONTAK_DARURAT = [];

if (typeof window !== 'undefined') {
    window.SEKOLAH_DATA = SEKOLAH_DATA;
    window.AKUN_DEVELOPER = AKUN_DEVELOPER;
    window.TRANSPORTASI_UMUM = TRANSPORTASI_UMUM;
    window.KONTAK_DARURAT = KONTAK_DARURAT;
}
