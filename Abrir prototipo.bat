@echo off
rem Abre el prototipo de la app en el navegador. Cerra esta ventana para apagarlo.
cd /d "%~dp0"
start "" http://localhost:5173/
python servidor.py 5173
