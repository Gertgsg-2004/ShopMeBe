@echo off
echo Starting ShopMeBe React Frontend...
cd /d "%~dp0client"
start cmd /k "npm run dev"
echo Frontend started at http://localhost:5173
