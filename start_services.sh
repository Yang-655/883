#!/bin/bash

# 启动直播平台所有服务的脚本
# 适用于宝塔面板部署环境

echo "========================================="
echo "  直播平台服务启动脚本"
echo "========================================="

# 检查是否在正确的目录
if [ ! -d "./backend" ] || [ ! -d "./frontend" ]; then
    echo "错误：请在项目根目录运行此脚本"
    echo "当前目录：$(pwd)"
    exit 1
fi

echo "当前目录：$(pwd)"

# 启动后端服务
echo "正在启动后端服务..."
cd ./backend
if command -v pm2 &> /dev/null; then
    pm2 start ecosystem.config.js >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✓ 后端服务启动成功"
    else
        echo "✗ 后端服务启动失败"
    fi
else
    echo "✗ PM2未安装，请先安装PM2"
    echo "  运行命令：npm install -g pm2"
fi
cd ..

# 启动SRS流媒体服务器
echo "正在启动SRS流媒体服务器..."
if [ -f "./srs/start.sh" ]; then
    chmod +x ./srs/start.sh
    nohup ./srs/start.sh >/dev/null 2>&1 &
    if [ $? -eq 0 ]; then
        echo "✓ SRS流媒体服务器启动成功"
    else
        echo "✗ SRS流媒体服务器启动失败"
    fi
else
    echo "✗ SRS启动脚本不存在"
    echo "  请先创建SRS启动脚本"
fi

echo "========================================="
echo "服务启动完成"
echo "请检查各服务状态以确保正常运行"
echo "========================================="