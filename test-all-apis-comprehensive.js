const axios = require('axios');

// Configuration
const BASE_URL = 'https://ivr.wxon.in/api';
const TEST_USER = {
  email: 'test@example.com',
  password: 'test123'
};

let authToken = '';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, success, error = null) {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}`);
  
  if (error) {
    console.log(`   Error: ${error.message || error}`);
  }
  
  results.tests.push({ name, success, error: error?.message || error });
  if (success) {
    results.passed++;
  } else {
    results.failed++;
  }
}

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    timeout: 10000
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

// Test functions
async function testHealthCheck() {
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    logTest('Health Check', response.status === 200);
    return true;
  } catch (error) {
    logTest('Health Check', false, error);
    return false;
  }
}

async function testAuth() {
  try {
    // Test registration (might fail if user exists, that's ok)
    try {
      await makeRequest('POST', '/auth/register', {
        name: 'Test User',
        email: TEST_USER.email,
        password: TEST_USER.password
      });
    } catch (regError) {
      // User might already exist, continue to login
    }
    
    // Test login
    const loginResponse = await makeRequest('POST', '/auth/login', TEST_USER);
    authToken = loginResponse.data.token;
    logTest('Authentication - Login', !!authToken);
    
    // Test profile
    const profileResponse = await makeRequest('GET', '/auth/profile');
    logTest('Authentication - Profile', profileResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Authentication', false, error);
    return false;
  }
}

async function testCampaigns() {
  try {
    // Get campaigns
    const getResponse = await makeRequest('GET', '/campaigns');
    logTest('Campaigns - Get All', getResponse.status === 200);
    
    // Create campaign
    const createResponse = await makeRequest('POST', '/campaigns', {
      name: 'Test Campaign',
      description: 'Test Description',
      type: 'bulk'
    });
    logTest('Campaigns - Create', createResponse.status === 201);
    
    const campaignId = createResponse.data.data.id;
    
    // Get single campaign
    const getSingleResponse = await makeRequest('GET', `/campaigns/${campaignId}`);
    logTest('Campaigns - Get Single', getSingleResponse.status === 200);
    
    // Update campaign
    const updateResponse = await makeRequest('PUT', `/campaigns/${campaignId}`, {
      name: 'Updated Test Campaign'
    });
    logTest('Campaigns - Update', updateResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Campaigns', false, error);
    return false;
  }
}

async function testContacts() {
  try {
    // Get contacts
    const getResponse = await makeRequest('GET', '/contacts');
    logTest('Contacts - Get All', getResponse.status === 200);
    
    // Create contact
    const createResponse = await makeRequest('POST', '/contacts', {
      name: 'Test Contact',
      phone: '+1234567890'
    });
    logTest('Contacts - Create', createResponse.status === 201);
    
    const contactId = createResponse.data.data.id;
    
    // Get single contact
    const getSingleResponse = await makeRequest('GET', `/contacts/${contactId}`);
    logTest('Contacts - Get Single', getSingleResponse.status === 200);
    
    // Bulk text import
    const bulkResponse = await makeRequest('POST', '/contacts/bulk-text', {
      numbers: '9876543210\n8765432109\n7654321098'
    });
    logTest('Contacts - Bulk Text Import', bulkResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Contacts', false, error);
    return false;
  }
}

async function testDevices() {
  try {
    // Get devices
    const getResponse = await makeRequest('GET', '/devices');
    logTest('Devices - Get All', getResponse.status === 200);
    
    // Register device
    const registerResponse = await makeRequest('POST', '/devices/register', {
      deviceId: 'test-device-123',
      deviceName: 'Test Device',
      androidVersion: '11',
      deviceModel: 'Test Model'
    });
    logTest('Devices - Register', registerResponse.status === 200);
    
    // Get device stats
    const statsResponse = await makeRequest('GET', '/devices/stats/summary');
    logTest('Devices - Stats', statsResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Devices', false, error);
    return false;
  }
}

async function testAnalytics() {
  try {
    // Basic analytics
    const basicResponse = await makeRequest('GET', '/analytics');
    logTest('Analytics - Basic', basicResponse.status === 200);
    
    // Dashboard analytics
    const dashboardResponse = await makeRequest('GET', '/analytics/dashboard');
    logTest('Analytics - Dashboard', dashboardResponse.status === 200);
    
    // Campaign analytics
    const campaignResponse = await makeRequest('GET', '/analytics/campaigns');
    logTest('Analytics - Campaigns', campaignResponse.status === 200);
    
    // Call analytics
    const callResponse = await makeRequest('GET', '/analytics/calls');
    logTest('Analytics - Calls', callResponse.status === 200);
    
    // Performance analytics
    const performanceResponse = await makeRequest('GET', '/analytics/performance');
    logTest('Analytics - Performance', performanceResponse.status === 200);
    
    // Test endpoint
    const testResponse = await makeRequest('GET', '/analytics/test');
    logTest('Analytics - Test', testResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Analytics', false, error);
    return false;
  }
}

async function testCallLogs() {
  try {
    // Get call logs
    const getResponse = await makeRequest('GET', '/call-logs');
    logTest('Call Logs - Get All', getResponse.status === 200);
    
    // Export CSV
    const exportResponse = await makeRequest('GET', '/call-logs/export/csv');
    logTest('Call Logs - Export CSV', exportResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Call Logs', false, error);
    return false;
  }
}

async function testSchedules() {
  try {
    // Get schedules
    const getResponse = await makeRequest('GET', '/schedules');
    logTest('Schedules - Get All', getResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Schedules', false, error);
    return false;
  }
}

async function testAudio() {
  try {
    // Get audio files
    const getResponse = await makeRequest('GET', '/audio');
    logTest('Audio - Get All', getResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Audio', false, error);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Tests...\n');
  console.log(`Testing against: ${BASE_URL}\n`);
  
  // Run tests in sequence
  await testHealthCheck();
  
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('\n❌ Authentication failed - skipping authenticated tests');
    return;
  }
  
  await testCampaigns();
  await testContacts();
  await testDevices();
  await testAnalytics();
  await testCallLogs();
  await testSchedules();
  await testAudio();
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => !t.success).forEach(test => {
      console.log(`   - ${test.name}: ${test.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});