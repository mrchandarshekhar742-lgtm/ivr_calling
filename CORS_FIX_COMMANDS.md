# 🔧 CORS Fix Commands - ivr.wxon.in

## 🚨 Problem
Frontend trying to access `http://localhost:5000` instead of `https://ivr.wxon.in`
CORS error: `Access-Control-Allow-Origin` header has value `http://localhost:3000`

## ⚡ Quick Fix

### Option 1: Run Fix Script
```bash
cd ~/ivr_calling
chmod +x fix-cors.sh
./fix-cors.sh
```

### Option 2: Manual Fix

#### Step 1: Update Backend Environment
```bash
cd ~/ivr_calling/backend
nano .env
```

**Change these values:**
```env
NODE_ENV=production
FRONTEND_URL=https://ivr.wxon.in
DB_HOST=localhost
DB_NAME=ivr_system_prod
DB_USER=ivr_user
DB_PASSWORD=IVR_wxon_2024_SecurePass!
```

#### Step 2: Update Frontend Environment
```bash
cd ~/ivr_calling/frontend
nano .env
```

**Change these values:**
```env
REACT_APP_API_URL=https://ivr.wxon.in
REACT_APP_SOCKET_URL=https://ivr.wxon.in
REACT_APP_ENVIRONMENT=production
```

#### Step 3: Rebuild Frontend
```bash
cd ~/ivr_calling/frontend
npm run build
```

#### Step 4: Restart Services
```bash
pm2 restart all
```

#### Step 5: Verify Fix
```bash
# Check PM2 status
pm2 status

# Test endpoints
curl https://ivr.wxon.in/health
curl https://ivr.wxon.in

# Check logs if needed
pm2 logs
```

## 🔍 Verification Steps

### 1. Check Environment Variables
```bash
# Backend
cd ~/ivr_calling/backend
grep FRONTEND_URL .env
# Should show: FRONTEND_URL=https://ivr.wxon.in

# Frontend
cd ~/ivr_calling/frontend
grep REACT_APP_API_URL .env
# Should show: REACT_APP_API_URL=https://ivr.wxon.in
```

### 2. Check PM2 Status
```bash
pm2 status
# Both services should be "online"
```

### 3. Test API Endpoints
```bash
# Health check
curl https://ivr.wxon.in/health

# API test
curl https://ivr.wxon.in/api/analytics/test
```

### 4. Browser Test
- Open `https://ivr.wxon.in`
- Open browser DevTools (F12)
- Try to register/login
- Check Network tab - should show requests to `https://ivr.wxon.in/api/`

## 🚨 Common Issues

### Issue 1: Services Not Restarting
```bash
# Force restart
pm2 delete all
cd ~/ivr_calling/backend
pm2 start server.js --name "ivr-backend" --env production
cd ~/ivr_calling/frontend
pm2 serve build 3000 --name "ivr-frontend" --spa
pm2 save
```

### Issue 2: Frontend Not Rebuilding
```bash
cd ~/ivr_calling/frontend
rm -rf build/
npm run build
pm2 restart ivr-frontend
```

### Issue 3: Database Connection Error
```bash
# Check database
mysql -u ivr_user -p ivr_system_prod

# If database doesn't exist, create it
mysql -u root -p
CREATE DATABASE ivr_system_prod;
CREATE USER 'ivr_user'@'localhost' IDENTIFIED BY 'IVR_wxon_2024_SecurePass!';
GRANT ALL PRIVILEGES ON ivr_system_prod.* TO 'ivr_user'@'localhost';
FLUSH PRIVILEGES;
```

### Issue 4: Nginx Configuration
```bash
# Check nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 📋 Expected Results

After fix:
- ✅ `https://ivr.wxon.in` loads without CORS errors
- ✅ Registration/Login works
- ✅ API calls go to `https://ivr.wxon.in/api/`
- ✅ No localhost references in browser network tab
- ✅ PM2 shows both services online

## 🔧 Debug Commands

```bash
# Check all environment variables
cd ~/ivr_calling/backend && cat .env
cd ~/ivr_calling/frontend && cat .env

# Check PM2 processes
pm2 status
pm2 logs

# Check nginx status
sudo systemctl status nginx

# Check SSL certificate
curl -I https://ivr.wxon.in

# Test API directly
curl -X POST https://ivr.wxon.in/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@test.com","phone":"1234567890","password":"password123"}'
```

## 🎯 Success Indicators

CORS is fixed when:
- ✅ No CORS errors in browser console
- ✅ API requests go to `https://ivr.wxon.in`
- ✅ Registration/Login works
- ✅ All features accessible
- ✅ No localhost references

**Run the fix script and your CORS issue will be resolved! 🚀**