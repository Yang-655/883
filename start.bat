@echo off
title 直播平台启动脚本

echo 正在启动直播平台...

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

REM 构建并启动所有服务
echo 正在构建并启动服务...
docker-compose up -d

REM 等待服务启动
echo 等待服务启动...
timeout /t 30 /nobreak >nul

REM 检查服务状态
echo 检查服务状态...
docker-compose ps

echo 直播平台已启动!
echo 访问地址:
echo - 前端界面: http://localhost
echo - 后端API: http://localhost:3000
echo - SRS管理: http://localhost:8080

pause