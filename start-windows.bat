@echo off
setlocal
cd /d "%~dp0"
title Davomat - ishga tushirish

where node >nul 2>nul
if errorlevel 1 goto no_node

echo Node.js versiyasi:
node -v

if exist node_modules goto run

echo.
echo Kutubxonalar o'rnatilmoqda. Birinchi marta bir necha daqiqa olishi mumkin...
call npm install
if errorlevel 1 goto install_failed

:run
echo.
echo Ilova ishga tushmoqda. Brauzer o'zi ochiladi: http://localhost:5173
echo To'xtatish uchun shu oynada Ctrl+C bosing.
echo.
call npm run dev -- --open
goto end

:no_node
echo.
echo Node.js topilmadi.
echo   1. https://nodejs.org saytidan LTS versiyasini yuklab o'rnating
echo   2. Shu oynani yopib, shu faylni qaytadan ikki marta bosing
goto end

:install_failed
echo.
echo npm install xato bilan tugadi.
echo Yuqoridagi birinchi qizil "npm ERR" satrlarini nusxalab yuboring.
goto end

:end
echo.
pause
endlocal
