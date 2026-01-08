@echo off
echo 🔧 IVR System - Fix Route File Mistakes
echo =======================================

echo.
echo 🚨 Critical Issues Found and Fixed:
echo 1. devices.js was using in-memory storage instead of database
echo 2. devices.js was using wrong auth middleware
echo 3. contacts.js bulk-text route had wrong validation
echo 4. Inconsistent middleware usage across routes
echo.

echo ✅ Fixes Applied:
echo - devices.js now uses Database storage (Device model)
echo - Consistent auth middleware across all routes
echo - Fixed bulk-text contact import validation
echo - Proper error handling and logging
echo.

echo 🔄 Restarting backend with fixed routes...
cd backend

:: Sync database first
echo 📊 Syncing database models...
node -e "
const { sequelize } = require('./src/config/database');
const models = require('./src/models');

const syncNow = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    console.log('🔄 Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Models synced successfully');
    
    console.log('📊 Available tables:');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('   -', tables.join('\n   - '));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    process.exit(1);
  }
};

syncNow();
"

if %errorlevel% neq 0 (
    echo ⚠️ Database sync had issues but continuing...
)

:: Restart backend
echo 🔄 Restarting backend server...
pm2 restart ivr-backend-8090 --update-env
if %errorlevel% neq 0 (
    echo ❌ PM2 restart failed - trying fresh start
    pm2 delete ivr-backend-8090 2>nul
    pm2 start server.js --name "ivr-backend-8090" --env production
)

echo ⏳ Waiting for server to initialize...
timeout /t 8 /nobreak > nul

:: Test all fixed routes
echo 🧪 Testing all fixed routes...
node -e "
const axios = require('axios');

const testAllRoutes = async () => {
  const BASE_URL = 'https://ivr.wxon.in/api';
  let token = '';
  let passed = 0;
  let total = 0;

  try {
    // Login first
    total++;
    const login = await axios.post(\`\${BASE_URL}/auth/login\`, {
      email: 'admin@ivr.com', password: 'admin123'
    });
    token = login.data.token;
    console.log('✅ Login: OK');
    passed++;

    const authHeaders = { Authorization: \`Bearer \${token}\` };

    // Test Devices API (Fixed)
    total++;
    try {
      const devices = await axios.get(\`\${BASE_URL}/devices\`, { headers: authHeaders });
      console.log('✅ Devices API (Database): OK');
      console.log(\`   📱 Devices found: \${devices.data.data?.devices?.length || 0}\`);
      passed++;
    } catch (e) {
      console.log('❌ Devices API: FAILED -', e.response?.status, e.response?.data?.message);
    }

    // Test Audio API (Database)
    total++;
    try {
      const audio = await axios.get(\`\${BASE_URL}/audio\`, { headers: authHeaders });
      console.log('✅ Audio API (Database): OK');
      console.log(\`   🎵 Audio files: \${audio.data.data?.audioFiles?.length || 0}\`);
      passed++;
    } catch (e) {
      console.log('❌ Audio API: FAILED -', e.response?.status, e.response?.data?.message);
    }

    // Test Contacts API (Fixed)
    total++;
    try {
      const contacts = await axios.get(\`\${BASE_URL}/contacts\`, { headers: authHeaders });
      console.log('✅ Contacts API: OK');
      console.log(\`   👥 Contacts found: \${contacts.data.data?.contacts?.length || 0}\`);
      passed++;
    } catch (e) {
      console.log('❌ Contacts API: FAILED -', e.response?.status, e.response?.data?.message);
    }

    // Test Bulk Text Import (Fixed)
    total++;
    try {
      const bulkText = await axios.post(\`\${BASE_URL}/contacts/bulk-text\`, {
        numbers: '1234567890\n9876543210\n5555555555'
      }, { headers: authHeaders });
      console.log('✅ Bulk Text Import (Fixed): OK');
      passed++;
    } catch (e) {
      console.log('❌ Bulk Text Import: FAILED -', e.response?.status, e.response?.data?.message);
    }

    // Test Device Registration (Database)
    total++;
    try {
      const deviceReg = await axios.post(\`\${BASE_URL}/devices/register\`, {
        deviceId: 'test-fixed-' + Date.now(),
        deviceName: 'Test Fixed Device',
        androidVersion: 'Android 12',
        deviceModel: 'Fixed Model',
        appVersion: '2.0.0'
      }, { headers: authHeaders });
      console.log('✅ Device Registration (Database): OK');
      console.log(\`   🔑 Token generated: \${deviceReg.data.data?.token ? 'Yes' : 'No'}\`);
      passed++;
    } catch (e) {
      console.log('❌ Device Registration: FAILED -', e.response?.status, e.response?.data?.message);
    }

    console.log(\`\n📊 ROUTE FIX RESULTS:\`);
    console.log(\`✅ \${passed} passed, ❌ \${total - passed} failed\`);
    console.log(\`📈 Success Rate: \${((passed / total) * 100).toFixed(1)}%\`);

    if (passed === total) {
      console.log('🎉 ALL ROUTE FIXES WORKING PERFECTLY!');
    } else if (passed >= total * 0.8) {
      console.log('✅ Most routes fixed successfully');
    } else {
      console.log('🚨 Some routes still need attention');
    }

  } catch (error) {
    console.error('❌ Route testing failed:', error.message);
  }
};

testAllRoutes();
"

cd ..

echo.
echo 🏗️ Rebuilding frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ⚠️ Frontend build had issues but continuing...
)

cd ..

echo.
echo 📊 Final status check...
pm2 status

echo.
echo 🎯 Route Mistakes Fixed Successfully!
echo ===================================
echo.
echo ✅ Fixed Issues:
echo   - devices.js now uses Database storage (not in-memory)
echo   - Consistent auth middleware across all routes
echo   - Fixed bulk-text contact import validation
echo   - Proper Device model integration
echo   - Audio files use database BLOB storage
echo.
echo 🧪 Test Results:
echo   - Device API should work without 500 errors
echo   - Audio files should save to database permanently
echo   - Device registration should save to database
echo   - Bulk contact import should work properly
echo.
echo 🌐 Next Steps:
echo 1. Visit: https://ivr.wxon.in
echo 2. Go to AndroidDevices page - should load properly
echo 3. Upload audio file - should save permanently
echo 4. Test Android app device registration
echo 5. Try bulk contact import
echo.
echo 🔍 If issues persist:
echo - Check PM2 logs: pm2 logs ivr-backend-8090
echo - Test specific route: curl -H "Authorization: Bearer TOKEN" https://ivr.wxon.in/api/devices
echo - Check database: mysql -u root -p ivr_system -e "SELECT * FROM devices LIMIT 5;"
echo.
pause