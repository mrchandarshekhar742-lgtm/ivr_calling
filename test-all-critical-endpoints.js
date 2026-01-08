const axios = require('axios');

const BASE_URL = 'http://localhost:8090/api';
let authToken = '';

// Test configuration
const testConfig = {
  email: 'test@example.com',
  password: 'password123'
};

async function testEndpoint(method, url, data = null, description = '') {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      ...(data && { data })
    };

    const response = await axios(config);
    console.log(`✅ ${method.toUpperCase()} ${url} - ${description} - Status: ${response.status}`);
    return response.data;
  } catch (error) {
    const status = error.response?.status || 'Network Error';
    const message = error.response?.data?.message || error.message;
    console.log(`❌ ${method.toUpperCase()} ${url} - ${description} - Status: ${status} - ${message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 TESTING ALL CRITICAL ENDPOINTS\n');

  // 1. Test Authentication
  console.log('📋 AUTHENTICATION TESTS');
  const loginResult = await testEndpoint('post', '/auth/login', testConfig, 'User login');
  if (loginResult?.data?.token) {
    authToken = loginResult.data.token;
    console.log('✅ Authentication successful\n');
  } else {
    console.log('❌ Authentication failed - creating test user');
    await testEndpoint('post', '/auth/register', {
      ...testConfig,
      name: 'Test User'
    }, 'Register test user');
    
    const retryLogin = await testEndpoint('post', '/auth/login', testConfig, 'Retry login');
    if (retryLogin?.data?.token) {
      authToken = retryLogin.data.token;
      console.log('✅ Authentication successful after registration\n');
    }
  }

  if (!authToken) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // 2. Test Campaign Endpoints
  console.log('📋 CAMPAIGN ENDPOINTS');
  await testEndpoint('get', '/campaigns', null, 'Get all campaigns');
  
  const campaignData = {
    name: 'Test Campaign',
    description: 'Test campaign for endpoint validation',
    type: 'bulk'
  };
  
  const newCampaign = await testEndpoint('post', '/campaigns', campaignData, 'Create campaign');
  const campaignId = newCampaign?.data?.id;
  
  if (campaignId) {
    await testEndpoint('get', `/campaigns/${campaignId}`, null, 'Get single campaign');
    await testEndpoint('put', `/campaigns/${campaignId}`, { name: 'Updated Campaign' }, 'Update campaign');
    await testEndpoint('post', `/campaigns/${campaignId}/start`, null, 'Start campaign');
    await testEndpoint('post', `/campaigns/${campaignId}/pause`, null, 'Pause campaign');
    await testEndpoint('post', `/campaigns/${campaignId}/resume`, null, 'Resume campaign');
    await testEndpoint('post', `/campaigns/${campaignId}/stop`, null, 'Stop campaign');
    await testEndpoint('delete', `/campaigns/${campaignId}`, null, 'Delete campaign');
  }
  console.log('');

  // 3. Test Contact Endpoints
  console.log('📋 CONTACT ENDPOINTS');
  await testEndpoint('get', '/contacts', null, 'Get all contacts');
  
  const contactData = {
    name: 'Test Contact',
    phone: '+1234567890',
    email: 'test@contact.com'
  };
  
  const newContact = await testEndpoint('post', '/contacts', contactData, 'Create contact');
  const contactId = newContact?.data?.id;
  
  if (contactId) {
    await testEndpoint('get', `/contacts/${contactId}`, null, 'Get single contact');
    await testEndpoint('put', `/contacts/${contactId}`, { name: 'Updated Contact' }, 'Update contact');
  }
  
  // Test bulk endpoints
  await testEndpoint('post', '/contacts/bulk', {
    contacts: [
      { name: 'Bulk Contact 1', phone: '+1111111111' },
      { name: 'Bulk Contact 2', phone: '+2222222222' }
    ]
  }, 'Bulk create contacts');
  
  await testEndpoint('post', '/contacts/bulk-text', {
    numbers: '3333333333\n4444444444\n5555555555'
  }, 'Bulk text import');
  
  if (contactId) {
    await testEndpoint('delete', `/contacts/${contactId}`, null, 'Delete contact');
  }
  console.log('');

  // 4. Test Device Endpoints
  console.log('📋 DEVICE ENDPOINTS');
  await testEndpoint('get', '/devices', null, 'Get all devices');
  await testEndpoint('get', '/devices/stats/summary', null, 'Get device stats');
  
  const deviceData = {
    deviceId: 'test-device-123',
    deviceName: 'Test Android Device',
    androidVersion: '11',
    deviceModel: 'Test Model'
  };
  
  const newDevice = await testEndpoint('post', '/devices/register', deviceData, 'Register device');
  
  if (newDevice?.data?.deviceId) {
    const deviceId = newDevice.data.deviceId;
    await testEndpoint('get', `/devices/${deviceId}`, null, 'Get single device');
    await testEndpoint('put', `/devices/${deviceId}/status`, { status: 'online' }, 'Update device status');
    await testEndpoint('post', `/devices/${deviceId}/test`, null, 'Test device connection');
    await testEndpoint('delete', `/devices/${deviceId}`, null, 'Delete device');
  }
  console.log('');

  // 5. Test Call Log Endpoints
  console.log('📋 CALL LOG ENDPOINTS');
  await testEndpoint('get', '/call-logs', null, 'Get all call logs');
  await testEndpoint('get', '/call-logs/export/csv', null, 'Export call logs CSV');
  console.log('');

  // 6. Test Analytics Endpoints
  console.log('📋 ANALYTICS ENDPOINTS');
  await testEndpoint('get', '/analytics', null, 'Get basic analytics');
  await testEndpoint('get', '/analytics/test', null, 'Test analytics endpoint');
  await testEndpoint('get', '/analytics/dashboard', null, 'Get dashboard analytics');
  await testEndpoint('get', '/analytics/campaigns', null, 'Get campaign analytics');
  await testEndpoint('get', '/analytics/calls', null, 'Get call analytics');
  await testEndpoint('get', '/analytics/performance', null, 'Get performance analytics');
  console.log('');

  // 7. Test Audio Endpoints
  console.log('📋 AUDIO ENDPOINTS');
  await testEndpoint('get', '/audio', null, 'Get all audio files');
  console.log('');

  // 8. Test Schedule Endpoints
  console.log('📋 SCHEDULE ENDPOINTS');
  await testEndpoint('get', '/schedules', null, 'Get all schedules');
  console.log('');

  console.log('🎉 ALL ENDPOINT TESTS COMPLETED!');
  console.log('📊 Check the results above for any failing endpoints.');
}

// Run the tests
runTests().catch(console.error);