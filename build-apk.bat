@echo off
echo ===================================
echo Building NurAl APK
echo ===================================

echo.
echo [1/3] Syncing files to Android...
npx cap sync android
if errorlevel 1 (
    echo ERROR: Sync failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Building APK with Gradle...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

cd ..

echo.
echo [3/3] APK Build Complete!
echo.
echo APK location:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
