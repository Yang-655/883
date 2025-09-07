#!/bin/bash

# 直播平台启动脚本

echo "正在启动直播平台..."

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

# 构建并启动所有服务
echo "正在构建并启动服务..."
docker-compose up -d

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

echo "直播平台已启动!"
echo "访问地址:"
echo "- 前端界面: http://localhost"
echo "- 后端API: http://localhost:3000"
echo "- SRS管理: http://localhost:8080"