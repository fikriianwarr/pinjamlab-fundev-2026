@echo off
setlocal
cd /d "%~dp0"
node --test tests/*.test.mjs
if errorlevel 1 (
  echo Ada pengujian yang gagal. Periksa hasil di atas.
) else (
  echo Seluruh pengujian lulus.
)
pause
