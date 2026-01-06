#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:8090';

async function testEndpoints() {
  console.log('🧪 Testing Dashboard Fix...\n');

  // Test 1: Health check
  try {
    console.log('1️⃣ Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', health.data.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }

  // Test 2: Analytics test endpoint
  try {
    console.log('\n2️⃣ Testing analytics test endpoint...');
    const analyticsTest = await axios.get(`${BASE_URL}/api/analytics/test`);
    console.log('✅ Analytics test passed:', analyticsTest.data.message);
  } catch (error) {
    console.log('❌ Analytics test failed:', error.message);
    return;
  }

  // Test 3: Dashboard endpoint (without auth - should fail with proper error)
  try {
    console.log('\n3️⃣ Testing dashboard endpoint (no auth)...');
    const dashboard = await axios.get(`${BASE_URL}/api/analytics/dashboard`);
    console.log('⚠️ Dashboard endpoint returned data without auth (unexpected)');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Dashboard endpoint properly requires authentication');
    } else {
      console.log('❌ Dashboard endpoint failed with unexpected error:', error.message);
    }
  }

  // Test 4: Login endpoint
  try {
    console.log('\n4️⃣ Testing login endpoint...');
    const login = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@ivr.com',
      password: 'admin123'
    });
    
    if (login.data.success && login.data.token) {
      console.log('✅ Login successful, testing authenticated dashboard...');
      
      // Test 5: Authenticated dashboard
      try {
        const authDashboard = await axios.get(`${BASE_URL}/api/analytics/dashboard`, {
          headers: {
            'Authorization': `Bearer ${login.data.token}`
          }
        });
        console.log('✅ Authenticated dashboard works!');
        console.log('📊 Dashboard data preview:', {
          totalCampaigns: authDashboard.data.data.overview.totalCampaigns,
          totalContacts: authDashboard.data.data.overview.totalContacts,
          successRate: authDashboard.data.data.overview.successRate
        });
      } catch (dashError) {
        console.log('❌ Authenticated dashboard failed:', dashError.message);
      }
    } else {
      console.log('❌ Login failed - no token received');
    }
  } catch (error) {
    console.log('❌ Login test failed:', error.message);
  }

  console.log('\n🎉 Dashboard fix test completed!');
}

testEndpoints().catch(console.error);