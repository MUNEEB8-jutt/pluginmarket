@echo off
title PluginVerse Launcher
color 0A
echo.
echo ========================================
echo    PLUGINVERSE MARKETPLACE LAUNCHER
echo ========================================
echo.
echo Starting Backend Server...
echo.

cd backend
start "PluginVerse Backend" cmd /k "py -m uvicorn server:app --host 0.0.0.0 --port 8000"

echo Backend started on port 8000
echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
echo.

cd ..\frontend
start "PluginVerse Frontend" cmd /k "npm start"

echo.
echo ========================================
echo    PLUGINVERSE IS STARTING!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Two windows will open:
echo   1. Backend Server (Python)
echo   2. Frontend Server (React)
echo.
echo Your browser will open automatically!
echo.
echo To stop: Close both server windows
echo ========================================
echo.
timeout /t 5 /nobreak >nul
start http://localhost:3000
exit
