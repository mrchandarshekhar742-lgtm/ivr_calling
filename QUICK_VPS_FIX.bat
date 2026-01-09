@echo off
echo 🚀 Quick VPS Auth Fix Deployment
echo ================================

REM Set colors for output
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

echo %YELLOW%📋 Starting VPS deployment...%NC%

REM Step 1: Connect and execute all commands
echo %YELLOW%🔧 Executing fix on VPS...%NC%

ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.196.226 "
echo '🔍 Current location:' && pwd &&
cd /var/www/ivr-platform/ivr_calling/frontend/src &&

echo '📁 Creating backup...' &&
cp utils/api.js utils/api.js.backup 2>/dev/null || echo 'No existing api.js to backup' &&
cp index.jsx index.jsx.backup 2>/dev/null || echo 'No existing index.jsx to backup' &&

echo '📝 Updating api.js...' &&
cat > utils/api.js << 'APIEOF'
import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: 'https://ivr.wxon.in',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => response, (error) => {
  if (error.response) {
    const { status, data } = error.response;
    if (status === 401 || status === 403) error.isAuthError = true;
    
    switch (status) {
      case 401:
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
        }
        break;
      case 403:
        toast.error('Access denied.');
        break;
      case 422:
        if (data.errors) {
          Object.values(data.errors).forEach(error => toast.error(error[0]));
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
        if (status >= 400) toast.error(data.message || 'An error occurred');
    }
  } else if (error.request) {
    toast.error('Network error. Please check your connection.');
  } else {
    toast.error('An unexpected error occurred.');
  }
  return Promise.reject(error);
});

export default api;
APIEOF

echo '📝 Updating index.jsx...' &&
cat > index.jsx << 'INDEXEOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth.jsx';
import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.isAuthError || error?.response?.status === 401 || error?.response?.status === 403) return false;
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
        if (error?.response?.status >= 500) return failureCount < 1;
        if (!error?.response) return failureCount < 2;
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error?.isAuthError || error?.response?.status === 401 || error?.response?.status === 403) return false;
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
        return false;
      }
    }
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <App />
          <Toaster position=\"top-right\" toastOptions={{
            duration: 4000,
            style: { background: '#363636', color: '#fff' },
            success: { duration: 3000, iconTheme: { primary: '#4ade80', secondary: '#fff' } },
            error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } }
          }} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
INDEXEOF

echo '🔨 Building frontend...' &&
cd /var/www/ivr-platform/ivr_calling/frontend &&
npm run build &&

echo '🚀 Deploying to web directory...' &&
cp -r build/* /var/www/html/ivr/ &&

echo '🔄 Restarting PM2...' &&
pm2 restart all &&
pm2 save &&

echo '🧪 Testing deployment...' &&
echo 'Frontend Status:' && curl -s -o /dev/null -w '%%{http_code}' https://ivr.wxon.in &&
echo '' &&
echo 'API Status (should be 401):' && curl -s -o /dev/null -w '%%{http_code}' https://ivr.wxon.in/api/devices &&
echo '' &&

echo '✅ DEPLOYMENT COMPLETED SUCCESSFULLY!' &&
echo '' &&
echo '📋 VERIFICATION STEPS:' &&
echo '1. Open https://ivr.wxon.in in browser' &&
echo '2. Check console - should show 401 errors (not 500)' &&
echo '3. Test login flow' &&
echo '4. In browser console run: window.apiTester?.testAllEndpoints()' &&
echo '' &&
echo '🎉 Auth fix deployed successfully!'
"

if %ERRORLEVEL% EQU 0 (
    echo %GREEN%✅ VPS deployment completed successfully!%NC%
    echo.
    echo %YELLOW%📋 Next Steps:%NC%
    echo 1. Open https://ivr.wxon.in in browser
    echo 2. Check browser console - should show 401 ^(not 500^)
    echo 3. Test login functionality
    echo 4. Verify no excessive API retries
    echo.
    echo %GREEN%🎉 Auth fix applied successfully!%NC%
) else (
    echo %RED%❌ Deployment failed. Check the error messages above.%NC%
    pause
)

pause