@echo off
chcp 65001 >nul
title 🌸 Sakura TOEIC 650+ Academy Server
echo ============================================================
echo   🌸 KHOI DONG SAKURA TOEIC 650+ ACADEMY (ANIME EDITION)
echo   👉 Dia chi Web: http://localhost:3650
echo ============================================================
start "" "http://localhost:3650"
node "%~dp0server.js"
pause
