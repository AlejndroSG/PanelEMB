@echo off
echo ======================================
echo  INICIANDO SISTEMA EN MODO LOCAL
echo ======================================
echo.

echo [1/4] Deteniendo contenedores Docker...
docker-compose down
echo.

echo [2/4] Corrigiendo la base de datos...
node fix-direct.js
echo.

echo [3/4] Iniciando backend en puerto 3002...
cd backend
start cmd /k "echo *** BACKEND EN PUERTO 3002 *** && npm install && npm run dev"

echo [4/4] Iniciando frontend en puerto 5173...
cd ..
cd frontend
timeout /t 3 /nobreak > nul
start cmd /k "echo *** FRONTEND EN PUERTO 5173 *** && npm install && npm run dev"

echo.
echo ======================================
echo  SISTEMA INICIADO EN MODO LOCAL
echo ======================================
echo.
echo Backend: http://localhost:3002
echo Frontend: http://localhost:5173
echo.
echo Usuario: aguayo@emb.com
echo Contraseña: 123456
echo.
echo Pulsa cualquier tecla para cerrar esta ventana.
echo Los servidores seguirán ejecutándose en sus ventanas.
pause > nul
