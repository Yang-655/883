# 直播平台部署指南

## 系统架构

本直播平台采用微服务架构，包含以下组件：

1. **前端应用** - React + Vite构建的用户界面
2. **后端服务** - Node.js + Express构建的API服务
3. **数据库** - MySQL数据库
4. **缓存服务** - Redis缓存服务
5. **流媒体服务器** - SRS流媒体服务器
6. **反向代理** - Nginx用于前端静态文件服务和API代理

## 部署方式

### Docker Compose部署（推荐）

1. 确保已安装Docker和Docker Compose
2. 克隆项目代码到服务器
3. 在项目根目录执行以下命令：

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f
```

4. 访问应用：
   - 前端界面：http://localhost
   - 后端API：http://localhost:3000
   - SRS管理界面：http://localhost:8080

### 宝塔面板部署

对于不熟悉Docker的用户，可以使用宝塔面板进行手动部署。详细步骤请参考 [BT_PANEL_DEPLOYMENT.md](file:///c%3A/Users/12568/LikePai/BT_PANEL_DEPLOYMENT.md) 文件。

### 手动部署

#### 后端服务部署

1. 安装依赖：
```bash
cd backend
npm install
```

2. 配置环境变量：
```bash
# 复制环境配置文件
cp .env.example .env

# 编辑环境配置文件
vim .env
```

3. 启动服务：
```bash
npm start
```

#### 前端应用部署

1. 安装依赖：
```bash
cd frontend
npm install
```

2. 构建生产版本：
```bash
npm run build
```

3. 部署构建产物到Web服务器

#### SRS流媒体服务器部署

1. 下载并安装SRS：
```bash
git clone https://github.com/ossrs/srs.git
cd srs/trunk
./configure
make
```

2. 启动SRS：
```bash
./objs/srs -c ../../srs/conf/live_streaming.conf
```

## 环境配置

### 数据库配置

- 开发环境：SQLite（用于本地开发）
- 生产环境：MySQL 8.0

### 环境变量

后端服务需要以下环境变量：

- `DB_HOST` - 数据库主机地址
- `DB_USER` - 数据库用户名
- `DB_PASSWORD` - 数据库密码
- `DB_NAME` - 数据库名称
- `REDIS_HOST` - Redis主机地址
- `REDIS_PORT` - Redis端口
- `JWT_SECRET` - JWT密钥
- `NODE_ENV` - 运行环境（development/production）

## 服务端口

- 前端：80 (Nginx)
- 后端：3000
- SRS RTMP：1935
- SRS HTTP API：1985
- SRS HTTP服务器：8080
- SRS RTC：8000
- 数据库：3306
- Redis：6379

## 管理员账户

系统默认管理员账户：

- 用户名：admin
- 邮箱：admin@example.com
- 密码：admin123（请在首次登录后修改）

## 故障排除

### 常见问题

1. **端口冲突**
   - 检查端口占用情况：`netstat -tulpn | grep :端口号`
   - 修改docker-compose.yml中的端口映射

2. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证数据库连接配置
   - 检查防火墙设置

3. **SRS服务无法启动**
   - 检查配置文件语法
   - 确认端口未被占用
   - 查看SRS日志文件

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f srs
```

## 性能优化建议

1. 使用CDN加速静态资源
2. 实施数据库读写分离
3. 添加Redis缓存热点数据
4. 使用负载均衡部署多个后端实例
5. 配置SRS集群以支持大规模并发