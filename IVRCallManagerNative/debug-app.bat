@echo off
echo Debugging IVR Call Manager App...
echo.

cd /d "%~dp0"

echo Checking connected devices...
adb devices

echo.
echo Clearing app data...
adb shell pm clear com.ivrcallmanager

echo.
echo Installing latest APK...
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    adb install -r app\build\outputs\apk\debug\app-debug.apk
    echo APK installed successfully
) else (
    echo APK not found! Build first using build-android.bat
    pause
    exit /b 1
)

echo.
echo Starting app with logging...
adb shell am start -n com.ivrcallmanager/.MainActivity

echo.
echo Monitoring app logs (Press Ctrl+C to stop)...
adb logcat -s "LoginActivity:*" "MainActivity:*" "IVRService:*" "AndroidRuntime:E"

pause