@echo off
setlocal
title ReelTrack VLC Companion
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is required to run the local ReelTrack VLC Companion.
  echo Install the current LTS version from https://nodejs.org, then reopen this file.
  echo.
  pause
  exit /b 1
)

:menu
cls
echo ======================================
echo       ReelTrack VLC Companion
echo ======================================
echo.
echo  1. Set up and pair this VLC computer
echo  2. Start VLC tracking
echo  3. Open setup instructions
echo  4. Exit
echo.
set /p choice=Choose an option (1-4): 

if "%choice%"=="1" goto pair
if "%choice%"=="2" goto watch
if "%choice%"=="3" goto help
if "%choice%"=="4" exit /b 0
echo Please choose 1, 2, 3, or 4.
timeout /t 2 >nul
goto menu

:pair
cls
echo This one-time setup generates a private local VLC password automatically.
echo It backs up your VLC preferences, enables the local Web interface, and requires a VLC restart.
echo.
echo Close VLC before continuing.
echo.
set /p pairCode=Paste the 8-character VLC pairing code: 
set /p deviceName=Give this computer a name (for example My VLC): 
if "%deviceName%"=="" set deviceName=My VLC
node index.mjs pair --code "%pairCode%" --name "%deviceName%"
echo.
pause
goto menu

:watch
cls
echo Start VLC first. The companion uses the private local credential created during setup.
echo.
node index.mjs watch
echo.
pause
goto menu

:help
start "" "%~dp0README.md"
goto menu
