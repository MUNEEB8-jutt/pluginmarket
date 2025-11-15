@echo off
title Stop PluginVerse
color 0C
echo.
echo ========================================
echo    STOPPING PLUGINVERSE
echo ========================================
echo.

echo Stopping Backend Server...
taskkill /FI "WINDOWTITLE eq PluginVerse Backend*" /F >nul 2>&1

echo Stopping Frontend Server...
taskkill /FI "WINDOWTITLE eq PluginVerse Frontend*" /F >nul 2>&1

echo.
echo ========================================
echo    ALL SERVERS STOPPED!
echo ========================================
echo.
timeout /t 2 /nobreak >nul
exit
