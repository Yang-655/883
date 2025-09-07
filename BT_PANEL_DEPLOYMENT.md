# 宝塔面板部署直播平台指南

## 系统要求

- 操作系统：Ubuntu 20.04 LTS 或 CentOS 8+
- 内存：4GB 或以上
- 存储：50GB SSD 或以上
- CPU：2核或以上

## 安装宝塔面板

### Ubuntu/Debian 系统：

```bash
wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && bash install.sh
```

### CentOS 系统：

```bash
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh
```

安装完成后，会显示面板地址、用户名和密码，请妥善保存。

## 安装必要软件

通过宝塔面板安装以下软件：

1. Nginx（最新稳定版）
2. MySQL 8.0
3. Redis
4. Node.js（版本16或18）
5. PM2（Node.js进程管理器）

## 部署步骤

### 1. 准备工作

上传项目代码到服务器，建议放在 `/www/wwwroot/livestream/` 目录下：

```bash
# 创建项目目录
mkdir -p /www/wwwroot/livestream

# 上传代码到该目录（通过FTP或Git）
# 项目结构应为：
# /www/wwwroot/livestream/
# ├── backend/
# ├── frontend/
# ├── srs/
# └── ...
```

### 2. 数据库配置

#### 创建数据库

1. 登录宝塔面板
2. 进入"数据库" -> "添加数据库"
3. 数据库名：`livestream_dev`
4. 用户名：`livestream`
5. 密码：设置一个安全密码（例如：livestream123）
6. 记住设置的密码，后续需要配置到环境变量中

#### 导入初始数据（如果有）

```bash
# 进入数据库管理界面导入SQL文件
# 或使用命令行：
mysql -u livestream -p livestream_dev < initial_data.sql
```

### 3. 后端服务部署

#### 安装依赖

```bash
cd /www/wwwroot/livestream/backend
npm install --production
```

#### 配置环境变量

创建或编辑 [.env](file:///c%3A/Users/12568/LikePai/backend/.env) 文件：

```bash
vim /www/wwwroot/livestream/backend/.env
```

内容如下：

```env
# 服务器配置
PORT=3000

# 数据库配置
DB_HOST=127.0.0.1
DB_USER=livestream
DB_PASSWORD=你设置的数据库密码
DB_NAME=livestream_dev

# Redis配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT密钥（设置一个复杂的随机字符串）
JWT_SECRET=live_streaming_secret_key_$(openssl rand -base64 32)

# Node环境
NODE_ENV=production
```

#### 使用PM2启动后端服务

创建PM2配置文件：

```bash
vim /www/wwwroot/livestream/backend/ecosystem.config.js
```

内容如下：

```javascript
module.exports = {
  apps: [{
    name: 'livestream-backend',
    script: './server.js',
    cwd: '/www/wwwroot/livestream/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

启动服务：

```bash
cd /www/wwwroot/livestream/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. 前端应用部署

#### 安装依赖并构建

```bash
cd /www/wwwroot/livestream/frontend
npm install
npm run build
```

构建完成后，静态文件会生成在 `dist` 目录中。

#### 配置Nginx站点

1. 在宝塔面板中添加站点：
   - 域名：你的域名（或服务器IP）
   - 根目录：`/www/wwwroot/livestream/frontend/dist`

2. 配置反向代理：
   点击站点 -> 反向代理 -> 添加反向代理

   - 代理名称：api
   - 目标URL：http://127.0.0.1:3000
   - 发送域名：$host
   - 启用代理缓存：关闭

3. 配置Socket.IO代理：
   添加第二个反向代理：

   - 代理名称：socket
   - 目标URL：http://127.0.0.1:3000
   - 发送域名：$host
   - 启用代理缓存：关闭
   - 替换域名：开启
   - 替换内容：/(.*) /socket.io/$1

4. 配置伪静态（用于前端路由）：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 5. SRS流媒体服务器部署

#### 下载并安装SRS

```bash
cd /www/server
git clone https://github.com/ossrs/srs.git
cd srs/trunk
./configure
make
```

#### 配置SRS

复制项目中的配置文件：

```bash
cp /www/wwwroot/livestream/srs/conf/live_streaming.conf /www/server/srs/trunk/conf/
```

修改配置文件中的回调地址：

```bash
vim /www/server/srs/trunk/conf/live_streaming.conf
```

将以下行：
```
on_publish      http://backend:3000/api/recordings/srs/start;
on_unpublish    http://backend:3000/api/recordings/srs/stop;
```

修改为：
```
on_publish      http://127.0.0.1:3000/api/recordings/srs/start;
on_unpublish    http://127.0.0.1:3000/api/recordings/srs/stop;
```

#### 创建SRS启动脚本

```bash
vim /www/server/srs/start.sh
```

内容如下：

```bash
#!/bin/bash
cd /www/server/srs/trunk
./objs/srs -c conf/live_streaming.conf
```

设置执行权限：

```bash
chmod +x /www/server/srs/start.sh
```

#### 使用Systemd管理SRS服务

创建服务文件：

```bash
vim /etc/systemd/system/srs.service
```

内容如下：

```ini
[Unit]
Description=SRS Live Streaming Server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/www/server/srs/start.sh
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
systemctl daemon-reload
systemctl start srs
systemctl enable srs
```

### 6. 防火墙配置

在宝塔面板中开放以下端口：

- 80 (HTTP)
- 443 (HTTPS)
- 1935 (RTMP)
- 1985 (SRS API)
- 8080 (SRS HTTP服务器)
- 8000 (SRS RTC)
- 3000 (后端API，可选)

### 7. SSL证书配置（可选但推荐）

1. 在宝塔面板中申请免费SSL证书
2. 为你的域名配置HTTPS
3. 修改前端代码中的API地址为HTTPS（如果需要）

## 启动和停止脚本

创建启动脚本：

```bash
vim /www/wwwroot/livestream/start.sh
```

内容如下：

```bash
#!/bin/bash
echo "启动直播平台服务..."

# 启动后端服务
pm2 start /www/wwwroot/livestream/backend/ecosystem.config.js

# 启动SRS流媒体服务器
systemctl start srs

echo "服务启动完成"
```

创建停止脚本：

```bash
vim /www/wwwroot/livestream/stop.sh
```

内容如下：

```bash
#!/bin/bash
echo "停止直播平台服务..."

# 停止后端服务
pm2 stop livestream-backend

# 停止SRS流媒体服务器
systemctl stop srs

echo "服务停止完成"
```

设置执行权限：

```bash
chmod +x /www/wwwroot/livestream/start.sh
chmod +x /www/wwwroot/livestream/stop.sh
```

## 管理员账户

系统默认管理员账户：

- 用户名：admin
- 邮箱：admin@example.com
- 密码：admin123

请在首次登录后修改密码。

## 监控和日志

### 查看服务状态

```bash
# 查看后端服务状态
pm2 list
pm2 logs livestream-backend

# 查看SRS状态
systemctl status srs

# 查看SRS日志
tail -f /www/server/srs/trunk/objs/srs.log
```

### 宝塔面板监控

- 在宝塔面板中可以查看CPU、内存、网络使用情况
- 可以设置网站和数据库的监控告警

## 故障排除

### 常见问题

1. **服务无法启动**
   - 检查端口是否被占用：`netstat -tuln | grep :端口号`
   - 查看服务日志：`pm2 logs` 或 `systemctl status 服务名`

2. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证数据库连接配置
   - 检查防火墙设置

3. **前端页面无法访问**
   - 检查Nginx配置
   - 确认后端API是否正常运行
   - 查看浏览器控制台错误信息

4. **推流失败**
   - 检查SRS服务是否启动
   - 验证推流地址是否正确
   - 查看SRS日志文件

### 日志文件位置

- 后端日志：通过 `pm2 logs livestream-backend` 查看
- SRS日志：`/www/server/srs/trunk/objs/srs.log`
- Nginx日志：宝塔面板网站管理中查看
- 系统日志：`/var/log/messages` 或 `journalctl -u 服务名`

## 性能优化建议

1. 使用CDN加速静态资源
2. 实施数据库读写分离
3. 添加Redis缓存热点数据
4. 配置SRS集群以支持大规模并发
5. 根据并发量调整服务器配置