# 🔧 Manual Fix Commands for API and Audio Issues

## Issue Summary
1. **Double /api in URLs**: Frontend was calling `/api/api/auth/me` instead of `/api/auth/me`
2. **Audio upload 500 errors**: BLOB storage causing memory issues, converted to file system
3. **Device display issues**: Backend needs restart after fixes

## ✅ FIXED IN CODE
- Fixed `frontend/src/utils/api.js` baseURL from `https://ivr.wxon.in/api` to `https://ivr.wxon.in`
- Updated `backend/src/models/AudioFile.js` to use file system instead of BLOB
- Updated `backend/src/routes/audio.js` to stream from disk

## 🚀 VPS Deployment Commands

### Step 1: Update Code on VPS
```bash
cd /var/www/ivr-platform/ivr_calling
git stash
git pull origin main
```

### Step 2: Update Database Schema
```bash
cd backend
node setup-database.js
```

### Step 3: Restart Backend
```bash
pm2 restart ivr-backend-8090
pm2 status
```

### Step 4: Rebuild Frontend
```bash
cd ../frontend
npm install
npm run build
cp -r build/* /var/www/html/ivr/
```

### Step 5: Restart Nginx
```bash
systemctl restart nginx
```

## 🧪 Test Commands

### Test API Endpoints
```bash
# Should return 401 (not 404)
curl https://ivr.wxon.in/api/auth/me

# Should return 401 (not 404)  
curl https://ivr.wxon.in/api/devices

# Should return 404 (double /api should not work)
curl https://ivr.wxon.in/api/api/auth/me
```

### Test Login Flow
```bash
# Login and get token
curl -X POST https://ivr.wxon.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ivr.com","password":"admin123"}'

# Use token to test endpoints (replace TOKEN with actual token)
curl https://ivr.wxon.in/api/devices \
  -H "Authorization: Bearer TOKEN"
```

### Check Services
```bash
# Check backend status
pm2 status | grep ivr-backend-8090

# Check nginx status
systemctl status nginx

# Check audio upload directory
ls -la /var/www/ivr-platform/ivr_calling/backend/uploads/audio/
```

## 🔗 Test URLs After Fix

1. **Main Website**: https://ivr.wxon.in
2. **Login**: https://ivr.wxon.in/login (admin@ivr.com / admin123)
3. **Android Devices**: https://ivr.wxon.in/android-devices
4. **Audio Files**: https://ivr.wxon.in/audio-files

## ✅ Expected Results

### Before Fix (Issues):
- ❌ `GET https://ivr.wxon.in/api/api/auth/me 404 (Not Found)`
- ❌ `POST https://ivr.wxon.in/api/audio 500 (Internal Server Error)`
- ❌ Devices not showing on website

### After Fix (Working):
- ✅ `GET https://ivr.wxon.in/api/auth/me 401 (Unauthorized)` - correct!
- ✅ Audio upload works without 500 errors
- ✅ Devices display correctly on website
- ✅ All endpoints respond correctly

## 🚨 If Issues Persist

### Check Backend Logs
```bash
pm2 logs ivr-backend-8090
```

### Check Nginx Logs
```bash
tail -f /var/log/nginx/error.log
```

### Restart Everything
```bash
pm2 restart ivr-backend-8090
systemctl restart nginx
```

### Database Issues
```bash
cd /var/www/ivr-platform/ivr_calling/backend
node setup-database.js
```

## 📱 Android App Testing

After fixes, test the Android app:
1. Login with existing credentials
2. Device should register successfully
3. Device should appear on website as "Online"
4. No more crashes during login

## 🎯 Success Indicators

1. **No 404 errors** in browser console for `/api/api/` URLs
2. **Audio upload works** without 500 errors
3. **Devices show as online** on website
4. **Android app connects** without crashes
5. **All endpoints return correct status codes**