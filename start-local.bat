@echo off
echo Starting IVR System Locally...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

timeout /t 3

echo Starting Frontend Development Server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo ✅ IVR System started locally!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8090
echo 📱 Android APK: ivr-manager-multi-device-v2.apk
echo.
echo Press any key to exit...
pause > nul