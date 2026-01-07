@echo off
echo 🚀 DEPLOYING CRITICAL API FIXES
echo ===============================

echo 📤 Pushing fixes to repository...
git add .
git commit -m "CRITICAL API FIXES: bulk-text route order, campaign validation, comprehensive testing"
git push origin main

echo.
echo ✅ Fixes pushed! Now run these commands on VPS:
echo.
echo ========================================
echo cd /var/www/ivr-platform/ivr_calling
echo git pull origin main
echo cd backend
echo pm2 restart ivr-backend-8090
echo pm2 logs ivr-backend-8090 --lines 5
echo node debug-api-issues.js
echo ========================================
echo.
echo 🔧 FIXES APPLIED:
echo ✅ Moved bulk-text route before :id route to prevent conflicts
echo ✅ Updated campaign validation to accept all types
echo ✅ Removed duplicate bulk-text route definition
echo ✅ Created comprehensive API testing script
echo.
pause