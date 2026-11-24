@echo off
title BusBuddy SMAN 5 Surabaya - Server API
color 0A
cd /d "%~dp0"
cls
echo =====================================================================
echo    BUSBUDDY SMAN 5 SURABAYA - SERVER API & DATABASE POSTGRESQL
echo =====================================================================
echo.
echo [*] Memulai server BusBuddy...
echo [*] Buka http://localhost:3000 atau file index.html di browser.
echo =====================================================================
echo.
node server.js
pause
