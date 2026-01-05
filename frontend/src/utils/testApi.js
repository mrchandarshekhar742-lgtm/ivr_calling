import api from './api';

// Test function to verify API base URL
export const testApiBaseUrl = () => {
  console.log('API Base URL:', api.defaults.baseURL);
  console.log('Environment Variables:');
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Test a simple API call
  return api.get('/health')
    .then(response => {
      console.log('Health check successful:', response.data);
      return response.data;
    })
    .catch(error => {
      console.error('Health check failed:', error);
      throw error;
    });
};

// Test devices endpoint
export const testDevicesEndpoint = () => {
  console.log('Testing devices endpoint...');
  console.log('Full URL will be:', api.defaults.baseURL + '/devices');
  
  return api.get('/devices')
    .then(response => {
      console.log('Devices endpoint successful:', response.data);
      return response.data;
    })
    .catch(error => {
      console.error('Devices endpoint failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw error;
    });
};