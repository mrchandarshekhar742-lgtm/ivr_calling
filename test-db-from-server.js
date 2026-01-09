// Test database connection from the running server context
const axios = require('axios');

async function testDatabaseConnection() {
  try {
    // Test a simple endpoint that doesn't require auth but uses database
    console.log('Testing database connection through server...');
    
    // First, let's check if we can get a proper error response
    const response = await axios.get('http://localhost:8090/api/devices');
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('Server responded with:', error.response.status, error.response.data);
    } else {
      console.log('Request failed:', error.message);
    }
  }
}

testDatabaseConnection();