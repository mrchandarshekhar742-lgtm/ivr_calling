@echo off
echo 🚨 Fixing Audio 500 Internal Server Error
echo ==========================================

echo 📤 Pushing emergency fix...
git add .
git commit -m "Emergency fix: Audio 500 error and database schema update"
git push origin main

echo.
echo ✅ Emergency fix pushed!
echo.
echo 📋 VPS Emergency Commands:
echo ========================================
echo cd /var/www/ivr-platform/ivr_calling
echo git pull origin main
echo.
echo # Check backend logs first
echo pm2 logs ivr-backend-8090 --lines 20
echo.
echo # Go to backend directory
echo cd backend
echo.
echo # Update database schema for BLOB
echo node setup-database.js
echo.
echo # Restart backend with fresh start
echo pm2 restart ivr-backend-8090
echo pm2 logs ivr-backend-8090 --lines 10
echo.
echo # Test audio endpoint
echo curl -H "Authorization: Bearer YOUR_TOKEN" https://ivr.wxon.in/api/audio
echo.
echo 🔧 If still 500 error, run:
echo ========================================
echo pm2 stop ivr-backend-8090
echo pm2 delete ivr-backend-8090
echo pm2 start server.js --name ivr-backend-8090
echo.
pause