@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Club Orders - Stop Script
echo ========================================
echo.

set "PIDFILE=%~dp0.pids"

if not exist "%PIDFILE%" (
    echo [OK]    No .pids file found. Nothing to stop.
    echo         (Only processes started by start.cmd are tracked.^)
    echo.
    pause
    exit /b 0
)

:: Read each line from .pids and kill the corresponding process
for /f "tokens=1,2 delims==" %%a in ('type "%PIDFILE%"') do (
    set "PROC_NAME=%%a"
    set "PROC_PID=%%b"

    :: Check if process is still running
    tasklist /fi "pid eq !PROC_PID!" 2>nul | find /i "!PROC_PID!" >nul
    if !errorlevel! equ 0 (
        echo [STOP]  Stopping !PROC_NAME! (PID: !PROC_PID!^)...
        taskkill /pid !PROC_PID! /f >nul 2>nul
        if !errorlevel! equ 0 (
            echo         !PROC_NAME! stopped.
        ) else (
            echo [WARN]  Failed to stop !PROC_NAME! (PID: !PROC_PID!^).
        )
    ) else (
        echo [OK]    !PROC_NAME! (PID: !PROC_PID!^) is not running.
    )
)

:: Remove the PID file
del "%PIDFILE%" >nul 2>nul

echo.
echo [DONE]  All tracked processes stopped. .pids file removed.
echo.
pause
