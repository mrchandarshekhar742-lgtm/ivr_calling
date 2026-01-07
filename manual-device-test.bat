@echo off
echo Manual Device Registration Test
echo ================================

echo.
echo Step 1: Getting auth token...
echo.

for /f "delims=" %%i in ('curl -s -X POST "https://ivr.wxon.in/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"admin@ivr.com\",\"password\":\"admin123\"}"') do set LOGIN_RESPONSE=%%i

echo Login Response: %LOGIN_RESPONSE%

echo.
echo Step 2: Extracting token...
echo Note: Copy the token value from above response

echo.
echo Step 3: Register test device manually...
echo.
echo Use this command with the token from above:
echo.
echo curl -X POST "https://ivr.wxon.in/api/devices/register" ^
echo   -H "Content-Type: application/json" ^
echo   -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
echo   -d "{\"deviceId\":\"test_device_123\",\"deviceName\":\"Test Android Device\",\"deviceModel\":\"Test Model\",\"androidVersion\":\"13\",\"appVersion\":\"2.0.0\"}"

echo.
echo Step 4: Check registered devices...
echo.
echo curl -X GET "https://ivr.wxon.in/api/devices" ^
echo   -H "Authorization: Bearer YOUR_TOKEN_HERE"

echo.
echo Step 5: Update device status to online...
echo.
echo curl -X PUT "https://ivr.wxon.in/api/devices/test_device_123/status" ^
echo   -H "Content-Type: application/json" ^
echo   -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
echo   -d "{\"status\":\"online\"}"

echo.
echo Then check website: https://ivr.wxon.in
echo Login and go to Android Devices section

pause