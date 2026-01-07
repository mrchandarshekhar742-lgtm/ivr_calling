@echo off
echo VPS Update Commands for IVR Call Manager
echo ==========================================

echo.
echo Step 1: Upload files to VPS
echo ----------------------------
echo Run these commands from your local machine:
echo.
echo scp -r backend/ root@your-vps-ip:/tmp/
echo scp -r frontend/ root@your-vps-ip:/tmp/
echo scp nginx-ivr-8090.conf root@your-vps-ip:/tmp/
echo.

echo Step 2: Connect to VPS and run update commands
echo ------------------------------------------------
echo ssh root@your-vps-ip
echo.

echo Step 3: Stop services
echo ----------------------
echo systemctl stop ivr-backend
echo systemctl stop nginx
echo.

echo Step 4: Update backend
echo -----------------------
echo cp -r /tmp/backend/* /var/www/ivr-call-manager/backend/
echo cd /var/www/ivr-call-manager/backend
echo npm install --production
echo.

echo Step 5: Update frontend
echo ------------------------
echo cp -r /tmp/frontend/* /var/www/ivr-call-manager/frontend/
echo cd /var/www/ivr-call-manager/frontend
echo npm install
echo npm run build
echo cp -r build/* /var/www/html/ivr/
echo.

echo Step 6: Update nginx config
echo -----------------------------
echo cp /tmp/nginx-ivr-8090.conf /etc/nginx/sites-available/ivr.wxon.in
echo nginx -t
echo.

echo Step 7: Start services
echo -----------------------
echo systemctl start nginx
echo systemctl start ivr-backend
echo.

echo Step 8: Test deployment
echo ------------------------
echo curl https://ivr.wxon.in/api/health
echo curl https://ivr.wxon.in
echo.

echo ==========================================
echo Android APK Location: Desktop/IVRCallManager.apk
echo Size: 5.6 MB (much smaller than before!)
echo ==========================================

pause