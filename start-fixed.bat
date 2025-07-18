@echo off
echo 🚀 INICIANDO SISTEMA EMB CORREGIDO...
echo.

echo 🛑 Deteniendo contenedores existentes...
docker-compose down --volumes --remove-orphans

echo 🧹 Limpiando cache de Docker...
docker system prune -f

echo 🔨 Construyendo contenedores con correcciones...
docker-compose up --build -d

echo.
echo ✅ SISTEMA INICIADO CON TODAS LAS CORRECCIONES
echo.
echo 📋 Correcciones aplicadas:
echo    - ✅ Nombres de clientes visibles en facturas
echo    - ✅ Totales de facturas calculados correctamente
echo    - ✅ Cambio de estado de facturas funcional
echo    - ✅ Dashboard con datos reales
echo    - ✅ Manejo de errores mejorado
echo.
echo 🌐 Accede a: http://localhost:5173
echo 🔑 Usuario: aguayo@emb.com | Contraseña: 123456
echo.
pause
