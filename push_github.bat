@echo off
chcp 65001 >nul
title 🌸 Push Sakura TOEIC 650+ len GitHub & GitHub Pages
cd /d "%~dp0"

echo ====================================================================
echo   🌸 DANG CHUAN BI PUSH LEN: https://github.com/lvmlegend/toeicmaster.git
echo ====================================================================

if not exist ".git" (
    git init
)

git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/lvmlegend/toeicmaster.git

echo [1/3] Dang them cac file Web, Bai Doc-Viet va Audio cat le...
git add .

echo [2/3] Dang tao commit...
git commit -m "feat: Sakura TOEIC 650+ Anime Web with Reading & Writing Studio for GitHub Pages"

echo [3/3] Dang push len GitHub (nhanh main)...
git push -u origin main --force

echo ====================================================================
echo   🎉 HOAN TAT!
echo   👉 Truy cap Settings -> Pages tren GitHub, chon Branch: main / (root)
echo   👉 Link GitHub Pages cua ban se la: https://lvmlegend.github.io/toeicmaster/
echo ====================================================================
pause
