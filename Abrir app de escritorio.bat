@echo off
rem Abre Mi día como app de pantalla completa (F11 la achica, Esc sale de pantalla completa).
cd /d "%~dp0escritorio"
if not exist node_modules\electron\dist\electron.exe (call npm install && node node_modules\electron\install.js)
start "" node_modules\electron\dist\electron.exe .
