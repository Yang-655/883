#!/bin/bash

# 直播平台停止脚本

echo "正在停止直播平台..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null
then
    echo "错误: 未安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null
then
    echo "错误: 未安装Docker Compose"
    exit 1
fi

# 停止所有服务
echo "正在停止所有服务..."
docker-compose down

echo "直播平台已停止!"