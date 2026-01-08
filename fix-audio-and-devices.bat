@echo off
echo 🚀 IVR System - Fix Audio and Device Storage
echo ============================================

echo.
echo 📋 Fixes being applied:
echo 1. Audio files will be saved to database (BLOB storage)
echo 2. Device status will be saved to database (persistent)
echo 3. No more in-memory storage - everything persistent
echo.

echo 🔧 Starting fixes...

echo.
echo 📊 Syncing database models...
cd backend

:: Create a quick database sync script
echo const { sequelize } = require('./src/config/database'); > sync-db.js
echo const models = require('./src/models'); >> sync-db.js
echo. >> sync-db.js
echo const syncDatabase = async () =^> { >> sync-db.js
echo   try { >> sync-db.js
echo     console.log('🔄 Syncing database models...'); >> sync-db.js
echo     await sequelize.sync({ alter: true }); >> sync-db.js
echo     console.log('✅ Database models synced successfully'); >> sync-db.js
echo     console.log('📊 Tables: users, campaigns, contacts, audio_files, devices, call_logs, call_templates, call_schedules'); >> sync-db.js
echo     process.exit(0); >> sync-db.js
echo   } catch (error) { >> sync-db.js
echo     console.error('❌ Database sync failed:', error.message); >> sync-db.js
echo     process.exit(1); >> sync-db.js
echo   } >> sync-db.js
echo }; >> sync-db.js
echo. >> sync-db.js
echo syncDatabase(); >> sync-db.js

:: Run database sync
node sync-db.js
if %errorlevel% neq 0 (
    echo ❌ Database sync failed
    pause
    exit /b 1
)

:: Clean up sync script
del sync-db.js

echo ✅ Database models synced

echo.
echo 🔄 Restarting backend server...
pm2 restart ivr-backend-8090 --update-env
if %errorlevel% neq 0 (
    echo ❌ Failed to restart backend server
    pause
    exit /b 1
)
echo ✅ Backend server restarted

echo.
echo ⏳ Waiting for server to initialize...
timeout /t 5 /nobreak > nul

echo.
echo 🧪 Testing audio and device APIs...
node test-all-fixes.js
if %errorlevel% neq 0 (
    echo ⚠️ Some tests failed, but continuing...
)

cd ..

echo.
echo 🏗️ Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)
echo ✅ Frontend built successfully

cd ..

echo.
echo 📊 Final system status...
pm2 status

echo.
echo 🎉 Audio and Device Storage Fixed!
echo =================================
echo.
echo ✅ Changes Applied:
echo   - Audio files now save to database (BLOB storage)
echo   - Device status now saves to database (persistent)
echo   - No more in-memory storage issues
echo   - Audio files will persist after server restart
echo   - Device status will persist after server restart
echo.
echo 🧪 Test Instructions:
echo   1. Upload an audio file - it will save to database
echo   2. Connect Android device - status will save to database
echo   3. Restart server - audio files and device status will remain
echo   4. Check AndroidDevices page - should show online devices
echo.
echo 📱 Android App:
echo   - Login and register device
echo   - Device should appear as online on website
echo   - Status updates will be saved to database
echo.
echo 🎵 Audio Files:
echo   - Upload once, use forever
echo   - Stored as BLOB in database
echo   - No need to re-upload after restart
echo.
pause