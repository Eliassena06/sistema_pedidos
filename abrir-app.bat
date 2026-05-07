@echo off
cd /d "%~dp0"
start "Sistema de Pedidos - Servidor" cmd /k "npm start"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:3000"
