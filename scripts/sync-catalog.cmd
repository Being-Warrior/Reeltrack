@echo off
cd /d "%~dp0.."
call npm run sync:tmdb
call npm run sync:upcoming
