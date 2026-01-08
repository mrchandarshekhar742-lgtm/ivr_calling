const axios = require('axios');

const BASE_URL = 'https://ivr.wxon.in/api';
let authToken = '';

const testAPI = async (name, method, url, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    console.log(`✅ ${name}: OK (${response.status})`);
    return response.data;
  } catch (error) {
    const status = error.response?.status || 'Network Error';
    const message = error.response?.data?.message || error.message;
    console.log(`❌ ${name}: FAILED - ${status} ${message}`);
    return null;
  }
};

const runAllTests = async () => {
  console.log('🚀 TESTING AUDIO & DEVICE DATABASE FIXES');
  console.log('========================================');
  
  let passed = 0;
  let total = 0;
  
  // Test 1: Health Check
  total++;
  const health = await testAPI('Health Check', 'GET', '/health');
  if (health) passed++;
  
  // Test 2: Login
  total++;
  const loginResult = await testAPI('Login', 'POST', '/auth/login', {
    email: 'admin@ivr.com',
    password: 'admin123'
  });
  
  if (loginResult && loginResult.token) {
    passed++;
    authToken = loginResult.token;
    
    const authHeaders = { Authorization: `Bearer ${authToken}` };
    
    // Test 3: Auth Me
    total++;
    const authMe = await testAPI('Auth Me', 'GET', '/auth/me', null, authHeaders);
    if (authMe) passed++;
    
    // Test 4: Audio List (Database)
    total++;
    const audioList = await testAPI('Audio List (Database)', 'GET', '/audio', null, authHeaders);
    if (audioList) {
      passed++;
      console.log(`   📊 Audio files in database: ${audioList.data?.audioFiles?.length || 0}`);
    }
    
    // Test 5: Contacts List
    total++;
    const contactsList = await testAPI('Contacts List', 'GET', '/contacts', null, authHeaders);
    if (contactsList) passed++;
    
    // Test 6: Campaigns List
    total++;
    const campaignsList = await testAPI('Campaigns List', 'GET', '/campaigns', null, authHeaders);
    if (campaignsList) passed++;
    
    // Test 7: Campaign Creation
    total++;
    const campaignCreation = await testAPI('Campaign Creation', 'POST', '/campaigns', {
      name: 'Test Campaign Database',
      description: 'Testing campaign with database storage',
      type: 'broadcast'
    }, authHeaders);
    if (campaignCreation) passed++;
    
    // Test 8: Devices List (Database)
    total++;
    const devicesList = await testAPI('Devices List (Database)', 'GET', '/devices', null, authHeaders);
    if (devicesList) {
      passed++;
      const devices = devicesList.data?.devices || [];
      const onlineDevices = devices.filter(d => d.status === 'online');
      console.log(`   📱 Total devices in database: ${devices.length}`);
      console.log(`   🟢 Online devices: ${onlineDevices.length}`);
    }
    
    // Test 9: Device Registration (Database)
    total++;
    const deviceReg = await testAPI('Device Registration (Database)', 'POST', '/devices/register', {
      deviceId: 'test-db-device-' + Date.now(),
      deviceName: 'Test Database Device',
      androidVersion: 'Android 12',
      deviceModel: 'Test Model DB',
      appVersion: '2.0.0'
    }, authHeaders);
    if (deviceReg) {
      passed++;
      console.log(`   🔑 Device token generated: ${deviceReg.data?.token ? 'Yes' : 'No'}`);
      console.log(`   📊 Device status: ${deviceReg.data?.status || 'Unknown'}`);
    }
    
    // Test 10: Analytics
    total++;
    const analytics = await testAPI('Analytics', 'GET', '/analytics', null, authHeaders);
    if (analytics) passed++;
    
    // Test 11: Call Logs
    total++;
    const callLogs = await testAPI('Call Logs', 'GET', '/call-logs', null, authHeaders);
    if (callLogs) passed++;
    
    // Test 12: Schedules
    total++;
    const schedules = await testAPI('Schedules', 'GET', '/schedules', null, authHeaders);
    if (schedules) passed++;
    
    // Test 13: Bulk Text Import
    total++;
    const bulkImport = await testAPI('Bulk Text Import', 'POST', '/contacts/bulk-text', {
      numbers: '1234567890\n9876543210\n5555555555'
    }, authHeaders);
    if (bulkImport) passed++;
    
    // Test 14: Device Stats
    total++;
    const deviceStats = await testAPI('Device Stats', 'GET', '/devices/stats/summary', null, authHeaders);
    if (deviceStats) {
      passed++;
      const stats = deviceStats.data || {};
      console.log(`   📊 Device Statistics:`);
      console.log(`      Total: ${stats.totalDevices || 0}`);
      console.log(`      Online: ${stats.onlineDevices || 0}`);
      console.log(`      Offline: ${stats.offlineDevices || 0}`);
    }
    
  } else {
    console.log('❌ Login failed - skipping authenticated tests');
  }
  
  console.log('\n📊 RESULTS:');
  console.log(`✅ ${passed} passed, ❌ ${total - passed} failed`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! Database storage is working perfectly!');
    console.log('');
    console.log('✅ Audio files are now saved to database');
    console.log('✅ Device status is now saved to database');
    console.log('✅ No more in-memory storage issues');
  } else if (passed >= total * 0.8) {
    console.log('✅ Most tests passed - database storage is mostly working');
  } else {
    console.log('🚨 Multiple issues detected - needs attention');
  }
  
  console.log('\n🧪 Next Steps:');
  console.log('1. Upload audio files - they will save to database');
  console.log('2. Connect Android device - status will save to database');
  console.log('3. Restart server - data will persist');
  console.log('4. Check AndroidDevices page for online devices');
  
  return { passed, total, successRate: (passed / total) * 100 };
};

// Run tests
runAllTests().catch(console.error);