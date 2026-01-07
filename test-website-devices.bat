@echo off
echo Testing Website Device Display
echo ==============================

echo.
echo Step 1: Getting fresh auth token...
for /f "delims=" %%i in ('curl -s -X POST "https://ivr.wxon.in/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"admin@ivr.com\",\"password\":\"admin123\"}"') do set LOGIN_RESPONSE=%%i

echo Login Response: %LOGIN_RESPONSE%

echo.
echo Step 2: Registering a test device...
curl -X POST "https://ivr.wxon.in/api/devices/register" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc2Nzc3NjY4NywiZXhwIjoxNzY3ODYzMDg3fQ.vxVzDzkHXV2u1cGK9QGCFu1DQEPV1241HnAfIioG2EA" ^
  -d "{\"deviceId\":\"website_test_789\",\"deviceName\":\"Website Test Device\",\"deviceModel\":\"Test Model\",\"androidVersion\":\"13\",\"appVersion\":\"2.0.0\"}"

echo.
echo Step 3: Setting device status to online...
curl -X PUT "https://ivr.wxon.in/api/devices/website_test_789/status" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc2Nzc3NjY4NywiZXhwIjoxNzY3ODYzMDg3fQ.vxVzDzkHXV2u1cGK9QGCFu1DQEPV1241HnAfIioG2EA" ^
  -d "{\"status\":\"online\"}"

echo.
echo Step 4: Checking all devices...
curl -X GET "https://ivr.wxon.in/api/devices" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc2Nzc3NjY4NywiZXhwIjoxNzY3ODYzMDg3fQ.vxVzDzkHXV2u1cGK9QGCFu1DQEPV1241HnAfIioG2EA"

echo.
echo.
echo ========================================
echo Now check the website:
echo 1. Go to: https://ivr.wxon.in
echo 2. Login: admin@ivr.com / admin123
echo 3. Click "Android Devices" in sidebar
echo 4. You should see devices listed
echo 5. If not, try refreshing the page (Ctrl+F5)
echo ========================================

pause