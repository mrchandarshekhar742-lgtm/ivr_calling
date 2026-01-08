/**
 * API Testing Utility for Production Debugging
 * Use this to safely test APIs with proper authentication
 */

import api from './api.js';

class APITester {
  constructor() {
    this.baseURL = 'https://ivr.wxon.in';
  }

  /**
   * Test authentication flow
   */
  async testAuth(email = 'test@example.com', password = 'password') {
    console.group('🔐 Authentication Test');
    
    try {
      // Test login
      console.log('Testing login...');
      const loginResponse = await api.post('/api/auth/login', { email, password });
      console.log('✅ Login successful:', loginResponse.data);
      
      // Test protected route
      console.log('Testing protected route...');
      const meResponse = await api.get('/api/auth/me');
      console.log('✅ Protected route works:', meResponse.data);
      
      return { success: true, token: loginResponse.data.data.token };
    } catch (error) {
      console.error('❌ Auth test failed:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Test all major endpoints
   */
  async testAllEndpoints() {
    console.group('🧪 Complete API Test Suite');
    
    const endpoints = [
      { method: 'GET', url: '/api/auth/me', name: 'User Profile' },
      { method: 'GET', url: '/api/devices', name: 'Devices List' },
      { method: 'GET', url: '/api/contacts', name: 'Contacts List' },
      { method: 'GET', url: '/api/campaigns', name: 'Campaigns List' },
      { method: 'GET', url: '/api/call-logs', name: 'Call Logs' },
      { method: 'GET', url: '/api/analytics/dashboard', name: 'Analytics Dashboard' },
      { method: 'GET', url: '/api/audio', name: 'Audio Files' }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint.name}...`);
        const response = await api[endpoint.method.toLowerCase()](endpoint.url);
        console.log(`✅ ${endpoint.name}:`, response.status, response.data?.message || 'OK');
        results.push({ ...endpoint, status: 'success', response: response.data });
      } catch (error) {
        const status = error.response?.status || 'Network Error';
        const message = error.response?.data?.message || error.message;
        console.error(`❌ ${endpoint.name}:`, status, message);
        results.push({ ...endpoint, status: 'error', error: { status, message } });
      }
    }

    console.groupEnd();
    return results;
  }

  /**
   * Test with manual token
   */
  async testWithToken(token) {
    console.group('🎫 Manual Token Test');
    
    // Temporarily set token
    const originalToken = localStorage.getItem('token');
    localStorage.setItem('token', token);

    try {
      const response = await api.get('/api/auth/me');
      console.log('✅ Token is valid:', response.data);
      return { success: true, user: response.data.data };
    } catch (error) {
      console.error('❌ Token test failed:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    } finally {
      // Restore original token
      if (originalToken) {
        localStorage.setItem('token', originalToken);
      } else {
        localStorage.removeItem('token');
      }
      console.groupEnd();
    }
  }

  /**
   * Generate curl commands for manual testing
   */
  generateCurlCommands() {
    const token = localStorage.getItem('token');
    const baseURL = this.baseURL;

    const commands = [
      `# Test without auth (should return 401)`,
      `curl -X GET "${baseURL}/api/devices"`,
      ``,
      `# Test with auth (should return 200)`,
      `curl -X GET "${baseURL}/api/devices" \\`,
      `  -H "Authorization: Bearer ${token || 'YOUR_TOKEN_HERE'}"`,
      ``,
      `# Test login`,
      `curl -X POST "${baseURL}/api/auth/login" \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '{"email":"your@email.com","password":"yourpassword"}'`,
      ``,
      `# Test user profile`,
      `curl -X GET "${baseURL}/api/auth/me" \\`,
      `  -H "Authorization: Bearer ${token || 'YOUR_TOKEN_HERE'}"`,
    ];

    console.log('📋 Curl Commands for Manual Testing:');
    console.log(commands.join('\n'));
    return commands;
  }

  /**
   * Monitor API calls in real-time
   */
  startMonitoring() {
    console.log('🔍 Starting API monitoring...');
    
    // Intercept all axios requests
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        const status = error.response?.status || 'Network Error';
        console.log(`❌ API Error: ${status} ${error.config?.url}`);
        return Promise.reject(error);
      }
    );

    // Return cleanup function
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
      console.log('🛑 API monitoring stopped');
    };
  }
}

// Create singleton instance
const apiTester = new APITester();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.apiTester = apiTester;
}

export default apiTester;