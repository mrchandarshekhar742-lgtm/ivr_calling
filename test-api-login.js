const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:8090/api/auth/login', {
      email: 'admin@ivr.com',
      password: 'admin123'
    });
    
    console.log('Login successful:', response.data);
    
    if (response.data.success && response.data.data.token) {
      const token = response.data.data.token;
      console.log('Testing devices endpoint with token...');
      
      const devicesResponse = await axios.get('http://localhost:8090/api/devices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Devices response:', devicesResponse.data);
    }
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

testLogin();