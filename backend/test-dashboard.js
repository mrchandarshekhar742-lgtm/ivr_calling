const axios = require('axios');

async function testDashboard() {
  try {
    console.log('🧪 Testing Dashboard API...');
    
    // Step 1: Test health
    console.log('\n1. Testing health endpoint...');
    const health = await axios.get('http://localhost:8090/health');
    console.log('✅ Health:', health.data);
    
    // Step 2: Test analytics test endpoint
    console.log('\n2. Testing analytics test endpoint...');
    const analyticsTest = await axios.get('http://localhost:8090/api/analytics/test');
    console.log('✅ Analytics test:', analyticsTest.data);
    
    // Step 3: Login to get token
    console.log('\n3. Logging in to get token...');
    const loginResponse = await axios.post('http://localhost:8090/api/auth/login', {
      email: 'admin@ivr.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // Step 4: Test dashboard with token
    console.log('\n4. Testing dashboard endpoint with token...');
    const dashboardResponse = await axios.get('http://localhost:8090/api/analytics/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Dashboard response:', JSON.stringify(dashboardResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

testDashboard();