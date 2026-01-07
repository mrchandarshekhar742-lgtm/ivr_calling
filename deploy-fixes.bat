@echo off
echo Deploying fixes to VPS...

echo.
echo 1. Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo 2. Copying frontend to VPS...
scp -r build/* root@66.116.196.226:/var/www/html/ivr/

echo.
echo 3. Updating backend on VPS...
cd ..
scp -r backend/* root@66.116.196.226:/var/www/ivr-platform/ivr_calling/backend/

echo.
echo 4. Restarting backend service...
ssh root@66.116.196.226 "cd /var/www/ivr-platform/ivr_calling/backend && pm2 restart ivr-backend-8090"

echo.
echo 5. Testing APIs...
ssh root@66.116.196.226 "cd /var/www/ivr-platform/ivr_calling/backend && node test-all-apis-final.js"

echo.
echo Deployment complete!
pause