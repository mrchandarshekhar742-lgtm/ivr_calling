import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: 'https://ivr.wxon.in',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Mark auth errors to prevent React Query retries
      if (status === 401 || status === 403) {
        error.isAuthError = true;
      }
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login (only show toast if not on login page)
          localStorage.removeItem('token');
          if (window.location.pathname !== '/login') {
            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
          }
          break;
          
        case 403:
          toast.error('Access denied. You don\'t have permission to perform this action.');
          break;
          
        case 404:
          // Don't show toast for 404s, let components handle them
          break;
          
        case 422:
          // Validation errors
          if (data.errors) {
            Object.values(data.errors).forEach(error => {
              toast.error(error[0]);
            });
          } else {
            toast.error(data.message || 'Validation error');
          }
          break;
          
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          if (status >= 400) {
            toast.error(data.message || 'An error occurred');
          }
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other error
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

export default api;