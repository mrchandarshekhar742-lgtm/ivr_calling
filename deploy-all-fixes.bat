@echo off
echo 🚀 DEPLOYING ALL API FIXES
echo ==========================

echo 📤 Pushing all fixes to repository...
git add .
git commit -m "FINAL API FIXES: bulk-text route, campaign validation, audio MIME types, comprehensive testing"
git push origin main

echo.
echo ✅ All fixes pushed to repository!
echo.
echo 📋 VPS DEPLOYMENT COMMANDS (Copy and run on VPS):
echo ================================================================
echo cd /var/www/ivr-platform/ivr_calling
echo git pull origin main
echo cd backend
echo.
echo # Restart backend to apply fixes
echo pm2 restart ivr-backend-8090
echo.
echo # Wait 3 seconds for restart
echo sleep 3
echo.
echo # Test all APIs
echo node test-all-apis-final.js
echo.
echo # If still issues, delete and restart fresh
echo pm2 delete ivr-backend-8090
echo pm2 start server.js --name "ivr-backend-8090"
echo.
echo # Check logs
echo pm2 logs ivr-backend-8090 --lines 10
echo.
echo # Rebuild frontend
echo cd ../frontend
echo npm run build
echo cp -r build/* /var/www/html/ivr/
echo ================================================================
echo.
echo 🎯 FIXES APPLIED:
echo ================
echo ✅ Fixed bulk-text route positioning (before :id routes)
echo ✅ Fixed campaign type validation (accepts broadcast, survey, etc.)
echo ✅ Fixed audio MIME type support (all formats)
echo ✅ Created comprehensive API testing
echo ✅ Removed duplicate route definitions
echo ✅ Fixed route order conflicts
echo.
echo 📊 EXPECTED RESULTS AFTER DEPLOYMENT:
echo ====================================
echo - API Success Rate: 100% (13/13 tests passing)
echo - Bulk Text Import: Working
echo - Campaign Creation: Working with all types
echo - Audio Upload/Play: Working with all formats
echo - Device Registration: Working
echo - All other APIs: Working
echo.
echo 🧪 MANUAL TESTING CHECKLIST:
echo ===========================
echo 1. Login to website: https://ivr.wxon.in
echo 2. Go to Contacts → Click "Bulk Numbers" → Add phone numbers
echo 3. Go to Campaigns → Create Campaign → Select audio file
echo 4. Go to Audio Files → Upload audio → Play audio
echo 5. Android app → Login → Check online status on website
echo.
pause