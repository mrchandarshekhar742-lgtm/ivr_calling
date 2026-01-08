import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth.jsx';
import './index.css';
import App from './App.jsx';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Never retry auth errors (401, 403)
        if (error?.isAuthError || 
            error?.response?.status === 401 || 
            error?.response?.status === 403) {
          return false;
        }
        // Never retry client errors (4xx)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry server errors (5xx) only once
        if (error?.response?.status >= 500) {
          return failureCount < 1;
        }
        // Retry network errors up to 2 times
        if (!error?.response) {
          return failureCount < 2;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: (failureCount, error) => {
        // Never retry mutations on auth errors
        if (error?.isAuthError || 
            error?.response?.status === 401 || 
            error?.response?.status === 403) {
          return false;
        }
        // Never retry client errors for mutations
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return false; // Generally don't retry mutations
      }
    }
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);