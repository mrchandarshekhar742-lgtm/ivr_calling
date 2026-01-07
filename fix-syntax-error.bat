@echo off
echo 🔧 Fixing Analytics Syntax Error
echo =================================

echo 📤 Pushing syntax fix...
git add .
git commit -m "Fix analytics.js syntax error causing backend crashes"
git push origin main

echo.
echo ✅ Syntax fix pushed!
echo.
echo 📋 VPS Commands to fix backend:
echo ========================================
echo cd /var/www/ivr-platform/ivr_calling
echo git pull origin main
echo cd backend
echo.
echo # Fix the syntax error
echo node fix-analytics-syntax-error.js
echo.
echo # Restart backend
echo pm2 restart ivr-backend-8090
echo.
echo # Check if it's working
echo pm2 logs ivr-backend-8090 --lines 5
echo curl https://ivr.wxon.in/api/analytics/test
echo.
echo 🎯 Expected result:
echo ========================================
echo Backend should start without syntax errors
echo curl should return: {"success":true,"message":"Analytics endpoint working"}
echo.
pause