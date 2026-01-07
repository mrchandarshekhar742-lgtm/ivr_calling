@echo off
echo Testing Device Registration with Backend...
echo.

cd /d "%~dp0"

echo Building and installing app...
call gradlew clean assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk

echo.
echo Starting app...
adb shell am start -n com.ivrcallmanager/.MainActivity

echo.
echo Testing backend device API...
echo.

echo 1. Testing login API...
curl -X POST "https://ivr.wxon.in/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@ivr.com\",\"password\":\"admin123\"}"

echo.
echo.
echo 2. Getting auth token for device registration test...
for /f "tokens=*" %%i in ('curl -s -X POST "https://ivr.wxon.in/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"admin@ivr.com\",\"password\":\"admin123\"}" ^| findstr /r "token"') do set TOKEN_LINE=%%i

echo.
echo 3. Testing device registration API...
echo Note: Use the token from login response above

echo.
echo 4. Check registered devices...
echo Go to: https://ivr.wxon.in
echo Login and check "Android Devices" section

echo.
echo App Test Steps:
echo 1. Open app on device
echo 2. Login with admin@ivr.com / admin123
echo 3. Click "Connect to Server"
echo 4. Should show "Device registered and connected!"
echo 5. Check website - device should appear as "online"

pause