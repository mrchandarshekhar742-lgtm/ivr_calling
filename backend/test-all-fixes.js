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
  console.log('🚀 TESTING ALL FIXES');
  console.log('====================');
  
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
    
    // Test 4: Audio List
    total++;
    const audioList = await testAPI('Audio List', 'GET', '/audio', null, authHeaders);
    if (audioList) passed++;
    
    // Test 5: Contacts List
    total++;
    const contactsList = await testAPI('Contacts List', 'GET', '/contacts', null, authHeaders);
    if (contactsList) passed++;
    
    // Test 6: Campaigns List (FIXED)
    total++;
    const campaignsList = await testAPI('Campaigns List', 'GET', '/campaigns', null, authHeaders);
    if (campaignsList) passed++;
    
    // Test 7: Campaign Creation (FIXED)
    total++;
    const campaignCreation = await testAPI('Campaign Creation', 'POST', '/campaigns', {
      name: 'Test Campaign Fix',
      description: 'Testing campaign creation fix',
      type: 'broadcast'
    }, authHeaders);
    if (campaignCreation) passed++;
    
    // Test 8: Devices List (FIXED)
    total++;
    const devicesList = await testAPI('Devices List', 'GET', '/devices', null, authHeaders);
    if (devicesList) passed++;
    
    // Test 9: Device Registration (FIXED)
    total++;
    const deviceReg = await testAPI('Device Registration', 'POST', '/devices/register', {
      deviceId: 'test-device-' + Date.now(),
      deviceName: 'Test Device Fix',
      androidVersion: 'Android 12',
      deviceModel: 'Test Model',
      appVersion: '2.0.0'
    }, authHeaders);
    if (deviceReg) passed++;
    
    // Test 10: Analytics (FIXED)
    total++;
    const analytics = await testAPI('Analytics', 'GET', '/analytics', null, authHeaders);
    if (analytics) passed++;
    
    // Test 11: Call Logs (FIXED)
    total++;
    const callLogs = await testAPI('Call Logs', 'GET', '/call-logs', null, authHeaders);
    if (callLogs) passed++;
    
    // Test 12: Schedules (FIXED)
    total++;
    const schedules = await testAPI('Schedules', 'GET', '/schedules', null, authHeaders);
    if (schedules) passed++;
    
    // Test 13: Bulk Text Import
    total++;
    const bulkImport = await testAPI('Bulk Text Import', 'POST', '/contacts/bulk-text', {
      numbers: '1234567890\n9876543210\n5555555555'
    }, authHeaders);
    if (bulkImport) passed++;
    
  } else {
    console.log('❌ Login failed - skipping authenticated tests');
  }
  
  console.log('\n📊 RESULTS:');
  console.log(`✅ ${passed} passed, ❌ ${total - passed} failed`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! System is working perfectly!');
  } else if (passed >= total * 0.8) {
    console.log('✅ Most tests passed - system is mostly working');
  } else {
    console.log('🚨 Multiple issues detected - needs attention');
  }
  
  return { passed, total, successRate: (passed / total) * 100 };
};

// Run tests
runAllTests().catch(console.error);