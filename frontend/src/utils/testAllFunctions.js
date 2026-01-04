// Comprehensive test utility for all button functions
import api from './api.js';

export const testAllFunctions = async () => {
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  console.log('🧪 Starting comprehensive button function tests...');

  // Test 1: Authentication endpoints
  try {
    console.log('Testing auth endpoints...');
    // Test if auth endpoints are accessible (will fail without credentials, but should not 404)
    await api.get('/api/auth/me').catch(err => {
      if (err.response?.status === 401) {
        results.passed.push('Auth endpoint accessible (401 expected)');
      } else {
        throw err;
      }
    });
  } catch (error) {
    results.failed.push(`Auth endpoint test failed: ${error.message}`);
  }

  // Test 2: Campaigns endpoints
  try {
    console.log('Testing campaigns endpoints...');
    await api.get('/api/campaigns');
    results.passed.push('Campaigns GET endpoint working');
  } catch (error) {
    results.failed.push(`Campaigns GET failed: ${error.message}`);
  }

  // Test 3: Contacts endpoints
  try {
    console.log('Testing contacts endpoints...');
    await api.get('/api/contacts');
    results.passed.push('Contacts GET endpoint working');
  } catch (error) {
    results.failed.push(`Contacts GET failed: ${error.message}`);
  }

  // Test 4: Audio endpoints
  try {
    console.log('Testing audio endpoints...');
    await api.get('/api/audio');
    results.passed.push('Audio GET endpoint working');
  } catch (error) {
    results.failed.push(`Audio GET failed: ${error.message}`);
  }

  // Test 5: Schedules endpoints
  try {
    console.log('Testing schedules endpoints...');
    await api.get('/api/schedules');
    results.passed.push('Schedules GET endpoint working');
  } catch (error) {
    results.failed.push(`Schedules GET failed: ${error.message}`);
  }

  // Test 6: Call logs endpoints
  try {
    console.log('Testing call logs endpoints...');
    await api.get('/api/call-logs');
    results.passed.push('Call logs GET endpoint working');
  } catch (error) {
    results.failed.push(`Call logs GET failed: ${error.message}`);
  }

  // Test 7: Analytics endpoints
  try {
    console.log('Testing analytics endpoints...');
    // First try the test endpoint (no auth required)
    const testResponse = await fetch('http://localhost:5000/api/analytics/test');
    if (testResponse.ok) {
      results.passed.push('Analytics test endpoint working');
      
      // Now try the main endpoint (will require auth)
      try {
        await api.get('/api/analytics');
        results.passed.push('Analytics main endpoint working');
      } catch (authError) {
        if (authError.response?.status === 401) {
          results.passed.push('Analytics main endpoint accessible (auth required)');
        } else {
          results.warnings.push('Analytics main endpoint auth issue');
        }
      }
    } else {
      results.failed.push('Analytics test endpoint failed - server restart needed');
    }
  } catch (error) {
    results.failed.push(`Analytics test failed: ${error.message} - Backend server needs restart`);
  }

  // Test 8: Static file serving
  try {
    console.log('Testing static file serving...');
    const response = await fetch('http://localhost:5000/uploads/');
    if (response.status === 200) {
      results.passed.push('Static file serving working');
    } else if (response.status === 403) {
      results.warnings.push('Static files accessible but directory listing disabled (normal)');
    } else {
      results.warnings.push(`Static files returned status: ${response.status}`);
    }
  } catch (error) {
    results.failed.push(`Static file serving failed: ${error.message}`);
  }

  // Test 9: CORS headers
  try {
    console.log('Testing CORS headers...');
    const response = await fetch('http://localhost:5000/api/campaigns', {
      method: 'OPTIONS'
    });
    const corsHeader = response.headers.get('Access-Control-Allow-Origin');
    if (corsHeader) {
      results.passed.push('CORS headers present');
    } else {
      results.warnings.push('CORS headers might be missing');
    }
  } catch (error) {
    results.failed.push(`CORS test failed: ${error.message}`);
  }

  // Print results
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);

  if (results.passed.length > 0) {
    console.log('\n✅ Passed Tests:');
    results.passed.forEach(test => console.log(`  - ${test}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => console.log(`  - ${test}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(test => console.log(`  - ${test}`));
  }

  return results;
};

// Function to test audio playback specifically
export const testAudioPlayback = async (audioFile) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`http://localhost:5000/uploads/audio/${audioFile.filename}`);
    
    audio.oncanplay = () => {
      console.log('✅ Audio can play');
      resolve(true);
    };
    
    audio.onerror = (e) => {
      console.error('❌ Audio error:', e);
      reject(new Error('Audio playback failed'));
    };
    
    // Set a timeout
    setTimeout(() => {
      reject(new Error('Audio load timeout'));
    }, 5000);
  });
};

// Function to check server status
export const checkServerStatus = async () => {
  const results = {
    serverRunning: false,
    analyticsWorking: false,
    serverRestarted: false
  };

  try {
    // Test basic server health
    const healthResponse = await fetch('http://localhost:5000/health');
    if (healthResponse.ok) {
      results.serverRunning = true;
      const healthData = await healthResponse.json();
      console.log('✅ Server is running:', healthData);
      
      // Check if server was recently restarted (uptime < 60 seconds)
      if (healthData.uptime < 60) {
        results.serverRestarted = true;
        console.log('🔄 Server was recently restarted');
      }
    }
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return results;
  }

  try {
    // Test analytics endpoint specifically
    const testResponse = await fetch('http://localhost:5000/api/analytics/test');
    
    if (testResponse.ok) {
      results.analyticsWorking = true;
      console.log('✅ Analytics endpoint working (test route)');
    } else if (testResponse.status === 404) {
      console.log('❌ Analytics endpoint still returns 404 - SERVER RESTART REQUIRED');
      console.log('🔄 Please stop backend server (Ctrl+C) and restart: cd backend && npm start');
    }
  } catch (error) {
    console.error('❌ Analytics check failed:', error.message);
  }

  return results;
};