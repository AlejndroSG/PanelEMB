@echo off
echo Starting EMB Billing System...
echo.

echo Starting backend server...
start "EMB Backend" cmd /k "cd backend && npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "EMB Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo EMB Billing System is starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
pause
