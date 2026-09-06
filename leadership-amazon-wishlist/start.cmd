@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Club Orders - Startup Script
echo ========================================
echo.

set "PIDFILE=%~dp0.pids"

:: Check if already running
if exist "%PIDFILE%" (
    echo [WARN]  A .pids file already exists. The project may already be running.
    echo         Run stop.cmd first, or delete .pids if stale.
    pause
    exit /b 1
)

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Download it from https://nodejs.org
    pause
    exit /b 1
)

:: Install npm dependencies if needed
if not exist "%~dp0node_modules" (
    echo [SETUP] Installing npm dependencies...
    call npm install --prefix "%~dp0."
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo.
)

:: Initialize empty PID file
type nul > "%PIDFILE%"

:: Check if MongoDB is running
tasklist /fi "imagename eq mongod.exe" 2>nul | find /i "mongod.exe" >nul
if %errorlevel% neq 0 (
    echo [WARN]  MongoDB does not appear to be running.
    echo         Attempting to start mongod...
    where mongod >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] mongod is not in PATH. Please start MongoDB manually
        echo         or add its bin directory to your PATH.
        del "%PIDFILE%" >nul 2>nul
        pause
        exit /b 1
    )
    for /f %%p in ('powershell -NoProfile -Command "(Start-Process -FilePath 'mongod' -PassThru).Id"') do (
        echo mongod=%%p>> "%PIDFILE%"
        echo         Started mongod with PID %%p
    )
    echo         Waiting for MongoDB to start...
    timeout /t 3 /nobreak >nul
) else (
    echo [OK]    MongoDB is already running (not managed by this script^).
)

:: Check if Ollama is running
tasklist /fi "imagename eq ollama.exe" 2>nul | find /i "ollama.exe" >nul
if %errorlevel% neq 0 (
    echo [WARN]  Ollama does not appear to be running.
    where ollama >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Ollama is not installed or not in PATH.
        echo         Download it from https://ollama.com
        call "%~dp0stop.cmd"
        pause
        exit /b 1
    )
    echo         Starting Ollama...
    for /f %%p in ('powershell -NoProfile -Command "(Start-Process -FilePath 'ollama' -ArgumentList 'serve' -PassThru).Id"') do (
        echo ollama=%%p>> "%PIDFILE%"
        echo         Started Ollama with PID %%p
    )
    echo         Waiting for Ollama to start...
    timeout /t 3 /nobreak >nul
) else (
    echo [OK]    Ollama is already running (not managed by this script^).
)

:: Pull the model if not already available
echo [SETUP] Ensuring Ollama model is available...
ollama list 2>nul | find /i "llama3.2" >nul
if %errorlevel% neq 0 (
    echo         Pulling llama3.2 (this may take a while on first run^)...
    ollama pull llama3.2
    if %errorlevel% neq 0 (
        echo [WARN]  Failed to pull model. Order info extraction will not work
        echo         until a model is available, but the app will still run.
    )
) else (
    echo [OK]    Model llama3.2 is available.
)

:: Start the Node server
echo.
echo ========================================
echo  Starting server...
echo ========================================
echo.

start "Club Orders Server" node "%~dp0server.js"
timeout /t 2 /nobreak >nul
for /f %%p in ('powershell -NoProfile -Command "(Get-Process -Name node -ErrorAction SilentlyContinue | Sort-Object StartTime -Descending | Select-Object -First 1).Id"') do (
    echo node=%%p>> "%PIDFILE%"
    echo [OK]    Node server started with PID %%p
)

echo.
echo [DONE]  All processes started. PIDs saved to .pids
echo         Run stop.cmd to shut down.
echo.
pause
