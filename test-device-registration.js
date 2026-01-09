const axios = require('axios');

async function testDeviceRegistration() {
  try {
    console.log('Testing device registration endpoint...');
    
    // Test without auth (should return 401)
    try {
      const response = await axios.post('https://ivr.wxon.in/api/devices/register', {
        deviceId: 'test-device-123',
        deviceName: 'Test Device'
      });
      console.log('Unexpected success:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('Expected auth error:', error.response.status, error.response.data);
      } else {
        console.log('Network error:', error.message);
      }
    }
    
  } catch (error) {
    console.log('Test failed:', error.message);
  }
}

testDeviceRegistration();