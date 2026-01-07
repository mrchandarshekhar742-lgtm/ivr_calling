const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'https://ivr.wxon.in';
let authToken = null;

async function testAllAPIs() {
    console.log('🚀 TESTING ALL APIs');
    console.log('==================\n');

    let passed = 0;
    let failed = 0;

    // 1. Health Check
    try {
        const health = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health Check: OK');
        passed++;
    } catch (error) {
        console.log('❌ Health Check: FAILED');
        failed++;
    }

    // 2. Login
    try {
        const login = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@ivr.com',
            password: 'admin123'
        });
        authToken = login.data.data?.token || login.data.token;
        console.log('✅ Login: OK');
        passed++;
    } catch (error) {
        console.log('❌ Login: FAILED');
        failed++;
        return;
    }

    const headers = { 'Authorization': `Bearer ${authToken}` };

    // 3. Auth Me
    try {
        await axios.get(`${BASE_URL}/api/auth/me`, { headers });
        console.log('✅ Auth Me: OK');
        passed++;
    } catch (error) {
        console.log('❌ Auth Me: FAILED');
        failed++;
    }

    // 4. Audio List
    try {
        await axios.get(`${BASE_URL}/api/audio`, { headers });
        console.log('✅ Audio List: OK');
        passed++;
    } catch (error) {
        console.log('❌ Audio List: FAILED');
        failed++;
    }

    // 5. Contacts List
    try {
        await axios.get(`${BASE_URL}/api/contacts`, { headers });
        console.log('✅ Contacts List: OK');
        passed++;
    } catch (error) {
        console.log('❌ Contacts List: FAILED');
        failed++;
    }

    // 6. Bulk Text Import
    try {
        await axios.post(`${BASE_URL}/api/contacts/bulk-text`, {
            contacts: [{ name: 'Test', phone: '999' + Date.now(), email: '', notes: 'Test' }]
        }, { headers });
        console.log('✅ Bulk Text Import: OK');
        passed++;
    } catch (error) {
        console.log('❌ Bulk Text Import: FAILED -', error.response?.status, error.response?.data?.message);
        failed++;
    }

    // 7. Campaigns List
    try {
        await axios.get(`${BASE_URL}/api/campaigns`, { headers });
        console.log('✅ Campaigns List: OK');
        passed++;
    } catch (error) {
        console.log('❌ Campaigns List: FAILED');
        failed++;
    }

    // 8. Campaign Creation
    try {
        await axios.post(`${BASE_URL}/api/campaigns`, {
            name: 'Test Campaign ' + Date.now(),
            description: 'Test',
            type: 'broadcast',
            settings: {}
        }, { headers });
        console.log('✅ Campaign Creation: OK');
        passed++;
    } catch (error) {
        console.log('❌ Campaign Creation: FAILED -', error.response?.status, error.response?.data?.message);
        failed++;
    }

    // 9. Devices List
    try {
        await axios.get(`${BASE_URL}/api/devices`, { headers });
        console.log('✅ Devices List: OK');
        passed++;
    } catch (error) {
        console.log('❌ Devices List: FAILED');
        failed++;
    }

    // 10. Device Registration
    try {
        await axios.post(`${BASE_URL}/api/devices/register`, {
            deviceId: 'TEST_' + Date.now(),
            deviceName: 'Test Device',
            androidVersion: '13',
            deviceModel: 'Test',
            appVersion: '1.0'
        }, { headers });
        console.log('✅ Device Registration: OK');
        passed++;
    } catch (error) {
        console.log('❌ Device Registration: FAILED');
        failed++;
    }

    // 11. Analytics
    try {
        await axios.get(`${BASE_URL}/api/analytics/dashboard`, { headers });
        console.log('✅ Analytics: OK');
        passed++;
    } catch (error) {
        console.log('❌ Analytics: FAILED');
        failed++;
    }

    // 12. Call Logs
    try {
        await axios.get(`${BASE_URL}/api/call-logs`, { headers });
        console.log('✅ Call Logs: OK');
        passed++;
    } catch (error) {
        console.log('❌ Call Logs: FAILED');
        failed++;
    }

    // 13. Schedules
    try {
        await axios.get(`${BASE_URL}/api/schedules`, { headers });
        console.log('✅ Schedules: OK');
        passed++;
    } catch (error) {
        console.log('❌ Schedules: FAILED');
        failed++;
    }

    console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`📈 Success Rate: ${((passed/(passed+failed))*100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 ALL APIs WORKING PERFECTLY!');
    } else if (failed <= 2) {
        console.log('\n⚠️  Minor issues, mostly working');
    } else {
        console.log('\n🚨 Multiple issues need attention');
    }
}

testAllAPIs().catch(console.error);