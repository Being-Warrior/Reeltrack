@echo off
setlocal
title Remove ReelTrack VLC background tracking
echo This removes the "ReelTrack VLC AutoSync" Windows sign-in task.
echo.
choice /M "Remove background tracking"
if errorlevel 2 exit /b 0
schtasks /Delete /TN "ReelTrack VLC AutoSync" /F
echo.
pause
