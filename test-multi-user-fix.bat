@echo off
echo Testing Multi-User Device Registration Fix
echo ==========================================

echo.
echo Step 1: Creating test user 2...
curl -X POST "https://ivr.wxon.in/api/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"Test\",\"lastName\":\"User2\",\"email\":\"test2@ivr.com\",\"password\":\"test123\"}"

echo.
echo Step 2: Login as user 1 (admin)...
for /f "delims=" %%i in ('curl -s -X POST "https://ivr.wxon.in/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"admin@ivr.com\",\"password\":\"admin123\"}"') do set USER1_LOGIN=%%i
echo User 1 Login: %USER1_LOGIN%

echo.
echo Step 3: Login as user 2 (test2)...
for /f "delims=" %%i in ('curl -s -X POST "https://ivr.wxon.in/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"test2@ivr.com\",\"password\":\"test123\"}"') do set USER2_LOGIN=%%i
echo User 2 Login: %USER2_LOGIN%

echo.
echo Step 4: Register same device ID with user 1...
curl -X POST "https://ivr.wxon.in/api/devices/register" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc2Nzc3Nzc3MCwiZXhwIjoxNzY3ODY0MTcwfQ.LTzVx3yLpp39hFDKntOeV_An0WhJSEKlIjTcALdT6-s" ^
  -d "{\"deviceId\":\"shared_device_123\",\"deviceName\":\"Shared Test Device User1\",\"deviceModel\":\"Test Model\",\"androidVersion\":\"13\",\"appVersion\":\"2.0.0\"}"

echo.
echo Step 5: Try to register same device ID with user 2 (should work now)...
curl -X POST "https://ivr.wxon.in/api/devices/register" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc2Nzc3OTA0OCwiZXhwIjoxNzY3ODY1NDQ4fQ.DJlPAuU9hlLll-9TOcMkltV-xGBDRwqHDkO0H5MkT8Y" ^
  -d "{\"deviceId\":\"shared_device_123\",\"deviceName\":\"Shared Test Device User2\",\"deviceModel\":\"Test Model\",\"androidVersion\":\"13\",\"appVersion\":\"2.0.0\"}"

echo.
echo Step 6: Check devices for user 1...
curl -X GET "https://ivr.wxon.in/api/devices" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc2Nzc3Nzc3MCwiZXhwIjoxNzY3ODY0MTcwfQ.LTzVx3yLpp39hFDKntOeV_An0WhJSEKlIjTcALdT6-s"

echo.
echo ========================================
echo Now test the Android app:
echo 1. Build and install updated app
echo 2. Login with admin@ivr.com
echo 3. Connect device
echo 4. Logout from app
echo 5. Login with test2@ivr.com
echo 6. Should be able to connect (new device ID generated)
echo ========================================

echo.
echo Website test:
echo 1. Go to: https://ivr.wxon.in
echo 2. Login and check Android Devices
echo 3. Click "Refresh" button if devices not showing
echo 4. Should see all registered devices
echo ========================================

pause