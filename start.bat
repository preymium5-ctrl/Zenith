@echo off
setlocal
cd /d "%~dp0"

set "PORT=3000"
set "URL=http://localhost:%PORT%/app/signup"

title Zenith - local server

where node >nul 2>nul
if %errorlevel%==0 goto :node
where python >nul 2>nul
if %errorlevel%==0 goto :python
goto :missing

:node
echo Starting the Zenith site with Node on port %PORT% ...
start "Zenith server" cmd /k node server.js
timeout /t 2 /nobreak >nul
start "" "%URL%"
echo.
echo Server is running in the "Zenith server" window.
echo   Home     http://localhost:%PORT%/
echo   Sign up  %URL%
echo   Sign in  http://localhost:%PORT%/app/signin
echo.
echo Close that window, or press Ctrl+C inside it, to stop the server.
timeout /t 6 /nobreak >nul
goto :eof

:python
echo Node.js was not found - falling back to Python's static server.
echo Pretty URLs are handled by server.js, so use the .html paths instead.
start "Zenith server" cmd /k python -m http.server %PORT%
timeout /t 2 /nobreak >nul
start "" "http://localhost:%PORT%/app/signup.html"
echo.
echo   Home     http://localhost:%PORT%/index.html
echo   Sign up  http://localhost:%PORT%/app/signup.html
echo.
timeout /t 6 /nobreak >nul
goto :eof

:missing
echo Neither Node.js nor Python was found on this machine.
echo Install Node.js from https://nodejs.org then run this file again.
echo.
pause
