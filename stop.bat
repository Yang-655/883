@echo off
title 直播平台停止脚本

echo 正在停止直播平台...

REM 检查Docker是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未安装Docker
    pause
    exit /b 1
)

REM 检查Docker Compose是否安装
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未安装Docker Compose
    pause
    exit /b 1
)

REM 停止所有服务
echo 正在停止所有服务...
docker-compose down

echo 直播平台已停止!

pause