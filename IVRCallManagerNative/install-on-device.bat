@echo off
echo Installing IVR Call Manager on device...
echo.

cd /d "%~dp0"

if not exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo ❌ APK not found! Build first using build-android.bat
    pause
    exit /b 1
)

echo Installing APK...
adb install -r app\build\outputs\apk\debug\app-debug.apk

if %ERRORLEVEL% EQU 0 (
    echo ✅ Installation successful!
    echo Starting app...
    adb shell am start -n com.ivrcallmanager/.MainActivity
) else (
    echo ❌ Installation failed!
    echo Make sure USB debugging is enabled
)

pause