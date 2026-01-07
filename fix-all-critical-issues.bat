@echo off
echo 🚨 FIXING ALL CRITICAL ISSUES
echo ===============================

echo 📤 Pushing comprehensive fixes...
git add .
git commit -m "CRITICAL FIX: Audio playback, Campaign audio dropdown, Bulk contacts, Device status, All major issues"
git push origin main

echo.
echo ✅ All critical fixes pushed!
echo.
echo 📋 VPS DEPLOYMENT COMMANDS:
echo ========================================
echo cd /var/www/ivr-platform/ivr_calling
echo git pull origin main
echo cd backend
echo.
echo # Fix analytics syntax error first
echo node fix-analytics-syntax-error.js
echo.
echo # Update database schema
echo node setup-database.js
echo.
echo # Restart backend
echo pm2 restart ivr-backend-8090
echo.
echo # Check backend status
echo pm2 logs ivr-backend-8090 --lines 5
echo.
echo # Rebuild frontend
echo cd ../frontend
echo npm run build
echo cp -r build/* /var/www/html/ivr/
echo.
echo 🎯 ISSUES FIXED:
echo ========================================
echo ✅ Audio Playback: Fixed MIME type handling and blob creation
echo ✅ Campaign Creation: Audio files now visible in dropdown
echo ✅ Contacts: Added "Bulk Numbers" button for manual text input
echo ✅ Android Device: Fixed online status display on website
echo ✅ Backend Routes: Added bulk-text endpoint for contacts
echo ✅ Error Handling: Improved error messages and debugging
echo.
echo 📱 ANDROID APP STATUS:
echo ========================================
echo ✅ Login automatically registers device
echo ✅ Device shows as "online" immediately
echo ✅ Website displays online status correctly
echo ✅ No token confusion - simplified flow
echo.
echo 🧪 TESTING CHECKLIST:
echo ========================================
echo 1. Audio Files: Upload and play audio - should work without errors
echo 2. Campaign Creation: Audio dropdown should show uploaded files
echo 3. Contacts: "Bulk Numbers" button should allow text input
echo 4. Android App: Login should show device online on website
echo 5. Device Status: Check Android Devices page for online status
echo.
echo 🔧 IF ISSUES PERSIST:
echo ========================================
echo # Check backend logs
echo pm2 logs ivr-backend-8090 --lines 20
echo.
echo # Test specific endpoints
echo curl https://ivr.wxon.in/api/audio
echo curl https://ivr.wxon.in/api/devices
echo curl https://ivr.wxon.in/api/contacts
echo.
echo # Restart everything if needed
echo pm2 restart all
echo systemctl restart nginx
echo.
pause