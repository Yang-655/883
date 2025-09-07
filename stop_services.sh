#!/bin/bash

# 停止直播平台所有服务的脚本
# 适用于宝塔面板部署环境

echo "========================================="
echo "  直播平台服务停止脚本"
echo "========================================="

# 停止后端服务
echo "正在停止后端服务..."
if command -v pm2 &> /dev/null; then
    pm2 stop livestream-backend >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✓ 后端服务停止成功"
    else
        echo "✗ 后端服务停止失败或服务未运行"
    fi
else
    echo "✗ PM2未安装"
fi

# 停止SRS流媒体服务器
echo "正在停止SRS流媒体服务器..."
if pgrep -f "srs" > /dev/null; then
    pkill -f "srs"
    if [ $? -eq 0 ]; then
        echo "✓ SRS流媒体服务器停止成功"
    else
        echo "✗ SRS流媒体服务器停止失败"
    fi
else
    echo "✗ SRS流媒体服务器未运行"
fi

echo "========================================="
echo "服务停止完成"
echo "========================================="