@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Pasang Node.js versi 22.13 atau lebih baru dari nodejs.org.
  pause
  exit /b 1
)
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||a===22&&b>=13?0:1)"
if errorlevel 1 (
  echo Node.js terlalu lama. Gunakan versi 22.13 atau lebih baru.
  pause
  exit /b 1
)
echo Buka http://127.0.0.1:8080 setelah pesan siap muncul.
echo Gunakan As a learner atau As the lab team untuk data contoh.
echo Tekan Ctrl+C untuk menghentikan server.
node server.mjs
pause
