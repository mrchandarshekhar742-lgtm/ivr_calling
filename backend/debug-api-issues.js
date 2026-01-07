const axios = require('axios');

const BASE_URL = 'https://ivr.wxon.in';
let authToken = null;

async function testSpecificIssues() {
    console.log('🔍 DEBUGGING SPECIFIC API ISSUES');
    console.log('================================\n');

    // 1. Login to get token
    try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@ivr.com',
            password: 'admin123'
        });
        
        authToken = loginResponse.data.data?.token || loginResponse.data.token;
        console.log('✅ Login successful, token obtained');
    } catch (error) {
        console.log('❌ Login failed:', error.response?.data || error.message);
        return;
    }

    const authHeaders = { 'Authorization': `Bearer ${authToken}` };

    // 2. Test bulk-text endpoint
    console.log('\n📋 Testing bulk-text endpoint...');
    try {
        const bulkResponse = await axios.post(`${BASE_URL}/api/contacts/bulk-text`, {
            contacts: [
                { name: 'Debug Test 1', phone: '9999999991', email: '', notes: 'Debug test' }
            ]
        }, { headers: authHeaders });
        
        console.log('✅ Bulk-text endpoint working:', bulkResponse.data);
    } catch (error) {
        console.log('❌ Bulk-text failed:', error.response?.status, error.response?.data || error.message);
    }

    // 3. Test campaign creation with detailed error
    console.log('\n📢 Testing campaign creation...');
    try {
        const campaignResponse = await axios.post(`${BASE_URL}/api/campaigns`, {
            name: 'Debug Test Campaign',
            description: 'Debug Test Campaign Description',
            type: 'broadcast',
            audioFileId: 1,
            settings: {
                maxRetries: 3,
                retryDelay: 5,
                dtmfTimeout: 10
            }
        }, { headers: authHeaders });
        
        console.log('✅ Campaign creation working:', campaignResponse.data);
    } catch (error) {
        console.log('❌ Campaign creation failed:', error.response?.status);
        console.log('Error details:', JSON.stringify(error.response?.data, null, 2));
    }

    // 4. Test contact creation with unique phone
    console.log('\n👤 Testing contact creation...');
    try {
        const uniquePhone = '999999' + Date.now().toString().slice(-4);
        const contactResponse = await axios.post(`${BASE_URL}/api/contacts`, {
            name: 'Debug Test Contact',
            phone: uniquePhone,
            email: 'debug@test.com',
            notes: 'Debug test contact'
        }, { headers: authHeaders });
        
        console.log('✅ Contact creation working:', contactResponse.data);
    } catch (error) {
        console.log('❌ Contact creation failed:', error.response?.status, error.response?.data || error.message);
    }

    // 5. Check available audio files
    console.log('\n🎵 Checking available audio files...');
    try {
        const audioResponse = await axios.get(`${BASE_URL}/api/audio`, { headers: authHeaders });
        console.log('✅ Audio files available:', audioResponse.data.data?.audioFiles?.length || 0);
        if (audioResponse.data.data?.audioFiles?.length > 0) {
            console.log('First audio file ID:', audioResponse.data.data.audioFiles[0].id);
        }
    } catch (error) {
        console.log('❌ Audio files check failed:', error.response?.data || error.message);
    }
}

testSpecificIssues().catch(console.error);