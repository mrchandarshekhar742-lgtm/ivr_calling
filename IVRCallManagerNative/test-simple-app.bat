@echo off
echo Testing Simple IVR Call Manager App...
echo.

cd /d "%~dp0"

echo Building simple APK...
call gradlew clean assembleDebug

if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ✅ APK built successfully!
    
    echo Installing on device...
    adb install -r app\build\outputs\apk\debug\app-debug.apk
    
    echo.
    echo Starting app...
    adb shell am start -n com.ivrcallmanager/.MainActivity
    
    echo.
    echo App should now be running without crashes!
    echo.
    echo Test Steps:
    echo 1. App should open without crashing
    echo 2. Click "Login" button
    echo 3. Enter: admin@ivr.com / admin123
    echo 4. Should login successfully
    echo 5. Click "Settings" to configure
    echo 6. Click "Connect to Server"
    echo.
    
) else (
    echo ❌ Build failed!
)

pause