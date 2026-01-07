@echo off
echo 🚨 EMERGENCY FIX DEPLOYMENT
echo ===========================

echo 📤 Pushing emergency fixes...
git add .
git commit -m "EMERGENCY FIX: handleBulkImport function and login issue fixes"
git push origin main

echo.
echo ✅ Emergency fixes pushed!
echo.
echo 📋 VPS COMMANDS (Run immediately):
echo ================================
echo cd /var/www/ivr-platform/ivr_calling
echo git pull origin main
echo.
echo # Fix backend login issue
echo cd backend
echo node check-login-issue.js
echo.
echo # Restart backend
echo pm2 restart ivr-backend-8090
echo.
echo # Test login
echo node -e "const axios = require('axios'); axios.post('https://ivr.wxon.in/api/auth/login', {email:'admin@ivr.com',password:'admin123'}).then(r => console.log('✅ Login OK')).catch(e => console.log('❌ Login failed:', e.response?.data))"
echo.
echo # Build frontend
echo cd ../frontend
echo npm run build
echo cp -r build/* /var/www/html/ivr/
echo.
echo # Final test
echo cd ../backend
echo node test-all-apis-final.js
echo ================================
echo.
pause