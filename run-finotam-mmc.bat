@echo off
cd /d "C:\Users\User\Desktop\logistics-app"

:: Port 5175-de ishleyen prosesi dayandir
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5175 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

timeout /t 1 /nobreak >nul

:: Proqrami baslat
start /min "Tetavio MMC Server" cmd /c "npm.cmd run dev -- --port 5175"

:: Serverin baslamasini gözle
timeout /t 3 /nobreak >nul

:: Brauzeri ac
start "" "http://localhost:5175"
