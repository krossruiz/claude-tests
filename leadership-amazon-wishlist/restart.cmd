@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Club Orders - Restart Script
echo ========================================
echo.

set "PIDFILE=%~dp0.pids"

:: Stop tracked processes if .pids exists
if exist "%PIDFILE%" (
    echo [STEP 1] Stopping tracked processes...
    echo.

    for /f "tokens=1,2 delims==" %%a in ('type "%PIDFILE%"') do (
        set "PROC_NAME=%%a"
        set "PROC_PID=%%b"

        tasklist /fi "pid eq !PROC_PID!" 2>nul | find /i "!PROC_PID!" >nul
        if !errorlevel! equ 0 (
            echo [STOP]  Stopping !PROC_NAME! (PID: !PROC_PID!^)...
            taskkill /pid !PROC_PID! /f >nul 2>nul
            echo         !PROC_NAME! stopped.
        ) else (
            echo [OK]    !PROC_NAME! (PID: !PROC_PID!^) is not running.
        )
    )

    del "%PIDFILE%" >nul 2>nul

    echo.
    echo         Waiting for processes to fully stop...
    timeout /t 2 /nobreak >nul
) else (
    echo [OK]    No .pids file found. Nothing to stop.
)

:: Start everything back up
echo.
echo [STEP 2] Starting processes...
echo.
call "%~dp0start.cmd"
