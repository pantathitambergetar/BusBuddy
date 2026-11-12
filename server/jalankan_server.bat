@echo off
title BusBuddy SMAN 5 Surabaya - Server MySQL API
color 0A
cd /d "%~dp0"
cls
echo =====================================================================
echo    BUSBUDDY SMAN 5 SURABAYA - SERVER API DAN DATABASE MYSQL
echo =====================================================================
echo.
echo [*] Memeriksa koneksi ke MySQL di localhost:3306...
echo.

node -e "const mysql = require('mysql2/promise'); require('dotenv').config(); mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT) || 3306, user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '' }).then(c => { console.log('>>> [OK] Koneksi MySQL terdeteksi!'); c.end(); process.exit(0); }).catch(e => { console.log('>>> [BELUM AKTIF] MySQL belum berjalan di port 3306.'); process.exit(1); });"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo =====================================================================
    echo [PERHATIAN] MySQL belum dinyalakan!
    echo.
    echo Langkah-langkah menyalakan MySQL:
    echo 1. Buka aplikasi XAMPP Control Panel di Windows Anda.
    echo 2. Cari baris bertuliskan 'MySQL', lalu klik tombol 'Start'.
    echo 3. Tunggu hingga tulisan 'MySQL' berubah latar belakang menjadi HIJAU.
    echo 4. Jalankan kembali file ini.
    echo =====================================================================
    echo.
    pause
    exit /b 1
)

echo.
echo [*] Langkah 1: Menyiapkan skema database 'busbuddy_db'...
node migrate.js

echo.
echo [*] Langkah 2: Mengimpor data siswa kelas XII-1 dari Google Sheets...
node import_sheet.js

echo.
echo =====================================================================
echo [SUKSES] Server BusBuddy aktif di http://localhost:3000
echo.
echo PENTING: Jangan tutup jendela terminal ini selama Anda membuka web!
echo Buka file 'index.html' di browser Anda untuk mulai menggunakan.
echo =====================================================================
echo.

node server.js
pause

