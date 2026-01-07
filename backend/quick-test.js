const axios = require('axios');

async function quickTest() {
    console.log('🔍 QUICK API TEST');
    
    // Login
    const login = await axios.post('https://ivr.wxon.in/api/auth/login', {
        email: 'admin@ivr.com',
        password: 'admin123'
    });
    
    const token = login.data.data?.token || login.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Test bulk-text
    try {
        const bulk = await axios.post('https://ivr.wxon.in/api/contacts/bulk-text', {
            contacts: [{ name: 'Test', phone: '999' + Date.now(), email: '', notes: 'Test' }]
        }, { headers });
        console.log('✅ Bulk-text: Working');
    } catch (error) {
        console.log('❌ Bulk-text:', error.response?.status, error.response?.data?.message);
    }
    
    // Test campaign
    try {
        const campaign = await axios.post('https://ivr.wxon.in/api/campaigns', {
            name: 'Test Campaign ' + Date.now(),
            description: 'Test',
            type: 'broadcast'
        }, { headers });
        console.log('✅ Campaign: Working');
    } catch (error) {
        console.log('❌ Campaign:', error.response?.status);
        console.log('Details:', JSON.stringify(error.response?.data, null, 2));
    }
}

quickTest().catch(console.error);