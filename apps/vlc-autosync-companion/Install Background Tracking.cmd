@echo off
setlocal
title Install ReelTrack VLC background tracking
echo This installs a per-user Windows sign-in task named "ReelTrack VLC AutoSync".
echo It starts this companion hidden after you sign in. It does not start VLC,
echo upload media files, or expose VLC outside this computer.
echo.
choice /M "Install background tracking"
if errorlevel 2 exit /b 0

schtasks /Create /TN "ReelTrack VLC AutoSync" /TR "wscript.exe ""%~dp0run-hidden.vbs""" /SC ONLOGON /RL LIMITED /F
if errorlevel 1 (
  echo.
  echo Installation failed. Try double-clicking this file normally from File Explorer.
) else (
  echo.
  echo Background tracking is installed. It will start automatically next time you sign in.
  echo To start it now without signing out, double-click run-hidden.vbs.
)
echo.
pause
