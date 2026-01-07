@echo off
echo Building IVR Call Manager APK...
echo.

cd /d "%~dp0"

echo Cleaning previous build...
call gradlew clean

echo Building APK...
call gradlew assembleDebug

echo.
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo ✅ APK Ready: app\build\outputs\apk\debug\app-debug.apk
    for %%I in ("app\build\outputs\apk\debug\app-debug.apk") do echo Size: %%~zI bytes
) else (
    echo ❌ Build failed!
)

pause