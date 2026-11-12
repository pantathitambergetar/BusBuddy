# 🚌 Panduan Database MySQL BusBuddy SMAN 5 Surabaya

Backend API BusBuddy menggunakan **Node.js + Express** dan terhubung ke database **MySQL** untuk menyimpan seluruh data siswa, guru, dan permintaan tebengan secara permanen dan aman tanpa menyimpan data di dalam source code frontend.

---

## 📋 Prasyarat

Pastikan salah satu layanan MySQL berikut sudah terpasang dan berjalan:
- **XAMPP** (nyalakan modul MySQL di XAMPP Control Panel) — *Paling Direkomendasikan*
- **MySQL Server** (melalui Windows Services atau MySQL Workbench)
- **Laragon** atau **Docker MySQL**

---

## ⚙️ Langkah 1: Konfigurasi Database (.env)

Buka file [server/.env](file:///c:/Data_D/coding/BusBuddy/server/.env) dan sesuaikan konfigurasi koneksi MySQL Anda:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=            # Isi jika root MySQL Anda memiliki password (kosongkan jika default XAMPP)
DB_NAME=busbuddy_db
SERVER_PORT=3000
ALLOWED_ORIGIN=http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,null
```

---

## 🚀 Langkah 2: Jalankan Migrasi Database

Jalankan perintah berikut di terminal untuk otomatis membuat database `busbuddy_db` dan seluruh tabelnya:

```bash
cd server
npm run migrate
```
*(Atau: `node migrate.js`)*

Skrip ini akan otomatis:
1. Membuat database `busbuddy_db` jika belum ada.
2. Membuat tabel `siswa`, `guru`, dan `tebengan_requests`.
3. Menyiapkan indeks performa untuk pencarian cepat berdasarkan NISN dan NIP.

---

## 🌐 Langkah 3: Menjalankan Server API

Jalankan server dengan perintah:

```bash
cd server
npm start
```
*(Atau: `node server.js`)*

Server akan aktif di: **`http://localhost:3000`**

---

## 🔄 Fitur Migrasi Data dari Browser ke MySQL

1. Buka aplikasi BusBuddy di browser.
2. Masuk menggunakan akun Developer (`developer` / `smaladev2026`).
3. Buka tab **💻 Developer Tools**.
4. Klik tombol hijau **`🔄 Migrasikan ke MySQL`**.
5. Sistem akan otomatis mentransfer seluruh data siswa dan guru yang tersimpan di browser langsung ke database MySQL.

---

## 📡 Daftar Endpoint API

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health` | Cek status server API & waktu server |
| `POST` | `/api/auth/login` | Login terpadu siswa/guru/developer langsung ke MySQL |
| `GET` | `/api/students` | Mengambil seluruh data siswa dari MySQL |
| `POST` | `/api/students` | Mendaftarkan siswa baru ke MySQL |
| `PUT` | `/api/students/:id` | Memperbarui koordinat/data siswa di MySQL |
| `DELETE` | `/api/students/:id` | Menghapus siswa dari MySQL |
| `GET` | `/api/teachers` | Mengambil seluruh data guru dari MySQL |
| `POST` | `/api/teachers` | Mendaftarkan guru baru ke MySQL |
| `DELETE` | `/api/teachers/:id` | Menghapus guru dari MySQL |
| `GET` | `/api/requests` | Mengambil riwayat permintaan tebengan dari MySQL |
| `POST` | `/api/requests` | Menyimpan permintaan tebengan baru ke MySQL |
| `POST` | `/api/migrate/import` | Bulk sync/import seluruh data ke MySQL |
