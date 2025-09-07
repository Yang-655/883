# 直播软件部署指南

## 1. 环境要求

### 1.1 系统要求
- 操作系统: Linux (推荐Ubuntu 20.04+) 或 Windows Server 2019+
- 内存: 最小4GB，推荐8GB以上
- 存储: 最小20GB可用空间
- 网络: 公网IP地址，开放必要端口

### 1.2 软件依赖
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+
- Docker (可选，推荐)
- SRS流媒体服务器

## 2. 后端服务部署

### 2.1 安装依赖
```bash
# 克隆项目代码
git clone [项目地址]
cd backend

# 安装Node.js依赖
npm install

# 创建环境配置文件
cp .env.example .env
# 编辑.env文件配置数据库和其他参数
```

### 2.2 数据库配置
```sql
-- 创建数据库
CREATE DATABASE livestream_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建数据库用户
CREATE USER 'livestream_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON livestream_dev.* TO 'livestream_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2.3 启动后端服务
```bash
# 开发环境启动
npm run dev

# 生产环境启动
npm start

# 或使用PM2管理进程
npm install -g pm2
pm2 start server.js --name "livestream-backend"
```

## 3. 流媒体服务器部署

### 3.1 安装SRS
```bash
# 下载SRS
git clone https://github.com/ossrs/srs.git
cd srs/trunk

# 编译安装
./configure
make

# 启动SRS
./objs/srs -c conf/live_streaming.conf
```

### 3.2 SRS配置
将之前创建的配置文件部署到SRS配置目录:
```bash
cp live_streaming.conf srs/trunk/conf/
```

## 4. 前端部署

### 4.1 构建前端项目
```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 构建生产版本
npm run build
```

### 4.2 部署前端文件
```bash
# 使用Nginx部署
# 将dist目录中的文件复制到Nginx网站目录
cp -r dist/* /var/www/html/

# 配置Nginx反向代理
```

### 4.3 Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 流媒体代理
    location /live/ {
        proxy_pass http://localhost:8080/live/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 5. Docker部署 (推荐)

### 5.1 Docker Compose配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: livestream_dev
      MYSQL_USER: livestream_user
      MYSQL_PASSWORD: secure_password
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:6.0
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=mysql
      - DB_USER=livestream_user
      - DB_PASSWORD=secure_password
      - DB_NAME=livestream_dev
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis

  srs:
    build: ./srs
    ports:
      - "1935:1935"  # RTMP
      - "8080:8080"  # HTTP-FLV/HLS
      - "1985:1985"  # HTTP API
    volumes:
      - ./srs/conf:/usr/local/srs/conf

volumes:
  mysql_data:
```

### 5.2 启动服务
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 6. 安全配置

### 6.1 SSL证书配置
```nginx
# 使用Let's Encrypt获取免费SSL证书
sudo apt install certbot
sudo certbot certonly --nginx -d your-domain.com
```

### 6.2 防火墙配置
```bash
# Ubuntu UFW配置
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 1935  # RTMP
sudo ufw allow 8080  # HTTP-FLV/HLS
sudo ufw enable
```

## 7. 监控和维护

### 7.1 日志管理
- 定期轮转日志文件
- 使用ELK栈进行日志分析
- 设置错误报警机制

### 7.2 备份策略
- 定期备份数据库
- 备份配置文件
- 版本控制所有配置

### 7.3 性能监控
- 使用Prometheus + Grafana监控系统性能
- 监控流媒体服务器状态
- 设置自动扩容机制

## 8. 故障排除

### 8.1 常见问题
1. 推流失败: 检查流密钥和推流地址
2. 拉流卡顿: 检查网络带宽和服务器负载
3. 登录失败: 检查数据库连接和用户凭证
4. 部分功能异常: 检查API服务状态

### 8.2 日志查看
```bash
# 查看后端日志
tail -f backend/logs/app.log

# 查看SRS日志
tail -f srs/trunk/objs/srs.log

# 查看系统日志
journalctl -u livestream-backend -f
```