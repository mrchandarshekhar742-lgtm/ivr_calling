const axios = require('axios');

async function debugCampaignIssue() {
    console.log('🔍 DEBUGGING CAMPAIGN CREATION ISSUE');
    console.log('===================================\n');

    try {
        // Login first
        const login = await axios.post('https://ivr.wxon.in/api/auth/login', {
            email: 'admin@ivr.com',
            password: 'admin123'
        });
        
        const token = login.data.data?.token || login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };
        
        console.log('✅ Login successful');

        // Try campaign creation with detailed error logging
        try {
            const campaignData = {
                name: 'Debug Test Campaign ' + Date.now(),
                description: 'Debug test',
                type: 'broadcast'
            };
            
            console.log('📤 Sending campaign data:', JSON.stringify(campaignData, null, 2));
            
            const response = await axios.post('https://ivr.wxon.in/api/campaigns', campaignData, { headers });
            
            console.log('✅ Campaign creation successful:', response.data);
            
        } catch (error) {
            console.log('❌ Campaign creation failed');
            console.log('Status:', error.response?.status);
            console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
            console.log('Error message:', error.message);
        }

    } catch (error) {
        console.log('❌ Login failed:', error.message);
    }
}

debugCampaignIssue();