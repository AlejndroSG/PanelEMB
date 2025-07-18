@echo off
echo 🔧 EJECUTANDO CORRECCIÓN DEFINITIVA...
echo.

echo 📋 Paso 1: Corrigiendo base de datos...
node fix-direct.js

echo.
echo 🔄 Paso 2: Reiniciando backend...
docker-compose restart backend

echo.
echo ⏳ Esperando que el backend se inicie...
timeout /t 5 /nobreak >nul

echo.
echo ✅ CORRECCIÓN COMPLETADA
echo.
echo 🌐 Prueba ahora: http://localhost:5173
echo 📋 El cambio de estado debería funcionar correctamente
echo.
pause
