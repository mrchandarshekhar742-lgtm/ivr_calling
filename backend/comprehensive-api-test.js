const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'https://ivr.wxon.in';
let authToken = null;

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null, headers = {}, expectedStatus = 200) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data) {
            if (data instanceof FormData) {
                config.data = data;
                config.headers = { ...config.headers, ...data.getHeaders() };
            } else {
                config.data = data;
            }
        }

        const response = await axios(config);
        
        if (response.status === expectedStatus) {
            log(`✅ ${method} ${endpoint} - SUCCESS (${response.status})`, 'green');
            return { success: true, data: response.data, status: response.status };
        } else {
            log(`⚠️  ${method} ${endpoint} - UNEXPECTED STATUS (${response.status}, expected ${expectedStatus})`, 'yellow');
            return { success: false, data: response.data, status: response.status };
        }
    } catch (error) {
        const status = error.response?.status || 'NO_RESPONSE';
        const message = error.response?.data?.message || error.message;
        
        if (status === expectedStatus) {
            log(`✅ ${method} ${endpoint} - SUCCESS (${status}) - ${message}`, 'green');
            return { success: true, status, message };
        } else {
            log(`❌ ${method} ${endpoint} - FAILED (${status}) - ${message}`, 'red');
            return { success: false, status, message, data: error.response?.data };
        }
    }
}

async function runComprehensiveAPITest() {
    log('\n🚀 COMPREHENSIVE API TESTING STARTED', 'blue');
    log('=====================================\n', 'blue');

    let passedTests = 0;
    let failedTests = 0;
    let totalTests = 0;

    // Test 1: Health Check
    log('📊 1. HEALTH & BASIC ENDPOINTS', 'blue');
    totalTests++;
    const healthTest = await testEndpoint('GET', '/health', null, {}, 200);
    if (healthTest.success) passedTests++; else failedTests++;

    // Test 2: Authentication
    log('\n🔐 2. AUTHENTICATION ENDPOINTS', 'blue');
    
    // Login test
    totalTests++;
    const loginTest = await testEndpoint('POST', '/api/auth/login', {
        email: 'admin@ivr.com',
        password: 'admin123'
    });
    
    if (loginTest.success && loginTest.data?.success) {
        authToken = loginTest.data.data?.token || loginTest.data.token;
        log(`🔑 Auth token obtained: ${authToken?.substring(0, 20)}...`, 'green');
        passedTests++;
    } else {
        failedTests++;
        log('❌ Cannot proceed without auth token', 'red');
        return;
    }

    const authHeaders = { 'Authorization': `Bearer ${authToken}` };

    // Test current user
    totalTests++;
    const meTest = await testEndpoint('GET', '/api/auth/me', null, authHeaders);
    if (meTest.success) passedTests++; else failedTests++;

    // Test 3: Audio Files API
    log('\n🎵 3. AUDIO FILES API', 'blue');
    
    totalTests++;
    const audioListTest = await testEndpoint('GET', '/api/audio', null, authHeaders);
    if (audioListTest.success) passedTests++; else failedTests++;

    // Test audio upload (if we have a test file)
    totalTests++;
    try {
        // Create a small test audio file buffer
        const testAudioBuffer = Buffer.from('fake audio data for testing');
        const formData = new FormData();
        formData.append('audio', testAudioBuffer, {
            filename: 'test-audio.mp3',
            contentType: 'audio/mpeg'
        });
        formData.append('name', 'Test Audio File');
        formData.append('category', 'test');

        const audioUploadTest = await testEndpoint('POST', '/api/audio', formData, authHeaders, 201);
        if (audioUploadTest.success) passedTests++; else failedTests++;
    } catch (error) {
        log('❌ Audio upload test failed', 'red');
        failedTests++;
    }

    // Test 4: Contacts API
    log('\n👥 4. CONTACTS API', 'blue');
    
    totalTests++;
    const contactsListTest = await testEndpoint('GET', '/contacts', null, authHeaders);
    if (contactsListTest.success) passedTests++; else failedTests++;

    totalTests++;
    const contactCreateTest = await testEndpoint('POST', '/contacts', {
        name: 'Test Contact',
        phone: '9876543210',
        email: 'test@example.com',
        notes: 'API Test Contact'
    }, authHeaders, 201);
    if (contactCreateTest.success) passedTests++; else failedTests++;

    // Test bulk text contacts
    totalTests++;
    const bulkTextTest = await testEndpoint('POST', '/contacts/bulk-text', {
        contacts: [
            { name: 'Bulk Test 1', phone: '9876543211', email: '', notes: 'Bulk test' },
            { name: 'Bulk Test 2', phone: '9876543212', email: '', notes: 'Bulk test' }
        ]
    }, authHeaders);
    if (bulkTextTest.success) passedTests++; else failedTests++;

    // Test 5: Campaigns API
    log('\n📢 5. CAMPAIGNS API', 'blue');
    
    totalTests++;
    const campaignsListTest = await testEndpoint('GET', '/campaigns', null, authHeaders);
    if (campaignsListTest.success) passedTests++; else failedTests++;

    totalTests++;
    const campaignCreateTest = await testEndpoint('POST', '/campaigns', {
        name: 'Test Campaign',
        description: 'API Test Campaign',
        audioFileId: 1,
        contactIds: [1, 2],
        settings: {
            maxRetries: 3,
            retryDelay: 5,
            dtmfTimeout: 10
        }
    }, authHeaders, 201);
    if (campaignCreateTest.success) passedTests++; else failedTests++;

    // Test 6: Devices API
    log('\n📱 6. DEVICES API', 'blue');
    
    totalTests++;
    const devicesListTest = await testEndpoint('GET', '/devices', null, authHeaders);
    if (devicesListTest.success) passedTests++; else failedTests++;

    totalTests++;
    const deviceRegisterTest = await testEndpoint('POST', '/devices/register', {
        deviceId: 'TEST_DEVICE_API_' + Date.now(),
        deviceName: 'API Test Device',
        androidVersion: '13',
        deviceModel: 'Test Model',
        appVersion: '2.0.0'
    }, authHeaders);
    if (deviceRegisterTest.success) passedTests++; else failedTests++;

    // Test 7: Analytics API
    log('\n📊 7. ANALYTICS API', 'blue');
    
    totalTests++;
    const analyticsTest = await testEndpoint('GET', '/analytics/dashboard', null, authHeaders);
    if (analyticsTest.success) passedTests++; else failedTests++;

    totalTests++;
    const analyticsTestEndpoint = await testEndpoint('GET', '/analytics/test', null, authHeaders);
    if (analyticsTestEndpoint.success) passedTests++; else failedTests++;

    // Test 8: Call Logs API
    log('\n📞 8. CALL LOGS API', 'blue');
    
    totalTests++;
    const callLogsTest = await testEndpoint('GET', '/call-logs', null, authHeaders);
    if (callLogsTest.success) passedTests++; else failedTests++;

    // Test 9: Schedules API
    log('\n⏰ 9. SCHEDULES API', 'blue');
    
    totalTests++;
    const schedulesTest = await testEndpoint('GET', '/schedules', null, authHeaders);
    if (schedulesTest.success) passedTests++; else failedTests++;

    // Test 10: Error Handling
    log('\n🚨 10. ERROR HANDLING TESTS', 'blue');
    
    totalTests++;
    const unauthorizedTest = await testEndpoint('GET', '/auth/me', null, {}, 401);
    if (unauthorizedTest.success) passedTests++; else failedTests++;

    totalTests++;
    const notFoundTest = await testEndpoint('GET', '/nonexistent-endpoint', null, authHeaders, 404);
    if (notFoundTest.success) passedTests++; else failedTests++;

    // Final Results
    log('\n📊 FINAL TEST RESULTS', 'blue');
    log('====================', 'blue');
    log(`✅ Passed: ${passedTests}/${totalTests}`, 'green');
    log(`❌ Failed: ${failedTests}/${totalTests}`, 'red');
    log(`📈 Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`, 'blue');

    if (failedTests === 0) {
        log('\n🎉 ALL TESTS PASSED! API is working perfectly!', 'green');
    } else if (failedTests <= 2) {
        log('\n⚠️  Minor issues found. Most APIs are working correctly.', 'yellow');
    } else {
        log('\n🚨 Multiple issues found. Backend needs attention.', 'red');
    }

    // Recommendations
    log('\n💡 RECOMMENDATIONS:', 'blue');
    if (failedTests === 0) {
        log('✅ Backend is fully functional', 'green');
        log('✅ All APIs are responding correctly', 'green');
        log('✅ Authentication is working', 'green');
        log('✅ Database operations are successful', 'green');
    } else {
        log('🔧 Check backend logs: pm2 logs ivr-backend-8090', 'yellow');
        log('🔧 Verify database connection', 'yellow');
        log('🔧 Check for syntax errors in route files', 'yellow');
        log('🔧 Ensure all required middleware is loaded', 'yellow');
    }
}

// Run the test
runComprehensiveAPITest().catch(error => {
    log(`\n💥 TEST RUNNER FAILED: ${error.message}`, 'red');
    process.exit(1);
});