@echo off
echo ===================================
echo Fixing and Building NurAl APK
echo ===================================

echo.
echo [1/4] Checking Android SDK...
if not exist "C:\android-sdk" (
    echo ERROR: Android SDK not found at C:\android-sdk
    pause
    exit /b 1
)

echo.
echo [2/4] Syncing web assets to Android...
npx cap sync android

echo.
echo [3/4] Checking Gradle wrapper...
cd android
if not exist "gradlew.bat" (
    echo Gradle wrapper not found. Re-initializing...
    cd ..
    npx cap add android
    cd android
)

echo.
echo [4/4] Building APK...
call gradlew.bat assembleDebug --no-daemon
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

cd ..
echo.
echo ===================================
echo BUILD COMPLETE!
echo ===================================
echo.
echo APK location:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
