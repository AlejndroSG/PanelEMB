@echo off
echo 🔄 REINICIO COMPLETO DEL SISTEMA EMB...
echo.

echo 🛑 Deteniendo todos los contenedores...
docker-compose down --volumes --remove-orphans

echo 🧹 Limpiando completamente Docker...
docker system prune -af --volumes

echo 🔨 Reconstruyendo desde cero...
docker-compose build --no-cache

echo 🚀 Iniciando sistema...
docker-compose up -d

echo.
echo ✅ SISTEMA REINICIADO COMPLETAMENTE
echo.
echo 🌐 Accede a: http://localhost:5173
echo 🔑 Usuario: aguayo@emb.com | Contraseña: 123456
echo.
echo 📋 Problemas solucionados:
echo    - ✅ Método updateInvoiceStatus disponible
echo    - ✅ Cálculo de totales corregido
echo    - ✅ Nombres de clientes visibles
echo.
pause
