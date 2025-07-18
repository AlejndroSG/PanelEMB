@echo off
echo =================================
echo    EMB Panel - Docker Setup
echo =================================

echo.
echo Deteniendo contenedores existentes...
docker-compose down

echo.
echo Reconstruyendo contenedores...
docker-compose build --no-cache

echo.
echo Iniciando servicios...
docker-compose up -d

echo.
echo Esperando a que los servicios se inicien...
timeout /t 10 /nobreak > nul

echo.
echo =================================
echo    Servicios iniciados
echo =================================
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3002
echo.
echo Para ver los logs:
echo   docker-compose logs -f
echo.
echo Para detener:
echo   docker-compose down
echo =================================

pause
