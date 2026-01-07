@echo off
echo 🔧 Fixing API Issues and Deploying Updates
echo ==========================================

echo 📤 Pushing code changes...
git add .
git commit -m "Fix API double /api issue and BLOB storage for audio files"
git push origin main

echo.
echo ✅ Code pushed successfully!
echo.
echo 📋 VPS Commands to run:
echo ========================================
echo cd /var/www/ivr-platform/ivr_calling
echo git stash
echo git pull origin main
echo cd backend
echo node setup-database.js
echo pm2 restart ivr-backend-8090
echo cd ../frontend
echo npm install
echo npm run build
echo cp -r build/* /var/www/html/ivr/
echo systemctl restart nginx
echo.
echo 🧪 Test the fixes:
echo ========================================
echo curl https://ivr.wxon.in/api/auth/me
echo curl https://ivr.wxon.in/api/devices
echo.
echo 🔗 Check these URLs:
echo ========================================
echo https://ivr.wxon.in (main site)
echo https://ivr.wxon.in/android-devices (device page)
echo https://ivr.wxon.in/audio-files (audio page)
echo.
pause