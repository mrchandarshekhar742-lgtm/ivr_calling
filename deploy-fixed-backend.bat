@echo off
echo 🚀 Starting IVR Backend Deployment (Fixed Version)...
echo.

REM Configuration
set VPS_HOST=66.116.196.226
set VPS_USER=root
set VPS_PATH=/var/www/ivr-platform/ivr_calling
set BACKEND_SERVICE=ivr-backend-8090

echo Configuration:
echo VPS Host: %VPS_HOST%
echo VPS User: %VPS_USER%
echo VPS Path: %VPS_PATH%
echo Service: %BACKEND_SERVICE%
echo.

echo 📋 Step 1: Stopping backend service...
ssh %VPS_USER%@%VPS_HOST% "pm2 delete %BACKEND_SERVICE% 2>/dev/null || true"

echo.
echo 📋 Step 2: Backing up current backend...
ssh %VPS_USER%@%VPS_HOST% "cd %VPS_PATH% && cp -r backend backend_backup_$(date +%%Y%%m%%d_%%H%%M%%S) 2>/dev/null || true"

echo.
echo 📋 Step 3: Copying fixed backend files...
scp -r backend/ %VPS_USER%@%VPS_HOST%:%VPS_PATH%/

echo.
echo 📋 Step 4: Installing dependencies...
ssh %VPS_USER%@%VPS_HOST% "cd %VPS_PATH%/backend && npm install --production"

echo.
echo 📋 Step 5: Starting backend service...
ssh %VPS_USER%@%VPS_HOST% "cd %VPS_PATH%/backend && pm2 start server.js --name '%BACKEND_SERVICE%' --env production"

echo.
echo 📋 Step 6: Saving PM2 configuration...
ssh %VPS_USER%@%VPS_HOST% "pm2 save"

echo.
echo 📋 Step 7: Checking service status...
ssh %VPS_USER%@%VPS_HOST% "pm2 status"

echo.
echo 📋 Step 8: Testing backend health...
timeout /t 5 /nobreak >nul
ssh %VPS_USER%@%VPS_HOST% "curl -s https://ivr.wxon.in/health || echo 'Health check failed'"

echo.
echo 📋 Step 9: Checking for errors...
ssh %VPS_USER%@%VPS_HOST% "pm2 logs %BACKEND_SERVICE% --lines 10 --nostream"

echo.
echo ✅ Deployment completed!
echo.
echo 🔍 To monitor the service:
echo    ssh %VPS_USER%@%VPS_HOST%
echo    pm2 logs %BACKEND_SERVICE%
echo.
echo 🌐 Test the API:
echo    curl https://ivr.wxon.in/health
echo    curl https://ivr.wxon.in/api/analytics/test
echo.
pause