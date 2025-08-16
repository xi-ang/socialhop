# 🚀 阿里云完整部署指南

## 📋 部署前准备

### 1. 域名准备
- 购买域名并完成备案
- 配置 DNS 解析到阿里云服务器 IP

### 2. 阿里云控制台配置
- 开放安全组端口：22, 80, 443, 3000
- 确保服务器可以访问外网

## 🛠️ 部署步骤

### 第一步：服务器初始化
```bash
# 1. 连接服务器
ssh root@your-server-ip

# 2. 上传并运行初始化脚本
wget https://raw.githubusercontent.com/your-repo/deploy/aliyun-setup.sh
chmod +x aliyun-setup.sh
./aliyun-setup.sh
```

### 第二步：安装数据库
```bash
# 运行数据库安装脚本
chmod +x install-postgresql.sh
./install-postgresql.sh
```

### 第三步：配置环境变量
```bash
# 1. 复制环境变量模板
cp .env.production.example .env.production

# 2. 编辑配置文件
vim .env.production

# 3. 设置正确的值：
# - DATABASE_URL (数据库连接)
# - UPLOADTHING_SECRET 和 UPLOADTHING_APP_ID
# - NEXTAUTH_SECRET
# - 域名信息
```

### 第四步：部署应用
```bash
# 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

### 第五步：配置 SSL 证书
```bash
# 1. 修改域名信息
vim install-ssl.sh

# 2. 运行 SSL 安装
chmod +x install-ssl.sh
./install-ssl.sh
```

### 第六步：验证部署
```bash
# 检查系统状态
./monitor.sh

# 检查应用是否正常运行
curl -I https://yourdomain.com
```

## 🔧 常用维护命令

### PM2 进程管理
```bash
pm2 status                # 查看进程状态
pm2 logs social-app       # 查看应用日志
pm2 restart social-app    # 重启应用
pm2 reload social-app     # 优雅重启
pm2 monitor               # 在线监控
```

### 数据库操作
```bash
# 进入数据库
sudo -u postgres psql social_prod

# 备份数据库
pg_dump -U social_user -h localhost social_prod > backup.sql

# 恢复数据库
psql -U social_user -h localhost social_prod < backup.sql
```

### Nginx 操作
```bash
sudo nginx -t                    # 测试配置
sudo systemctl reload nginx     # 重载配置
sudo systemctl restart nginx    # 重启服务
```

### 证书续期
```bash
sudo certbot renew             # 手动续期
sudo certbot certificates      # 查看证书状态
```

## 📊 性能优化建议

### 1. 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
```

### 2. PM2 集群模式（多核服务器）
```javascript
// ecosystem.config.js
instances: 'max', // 使用所有CPU核心
exec_mode: 'cluster'
```

### 3. Redis 缓存（可选）
```bash
# 安装 Redis
sudo apt install redis-server

# 在应用中使用 Redis 缓存
# - 会话存储
# - 页面缓存
# - 数据缓存
```

## 🚨 故障排查

### 应用无法启动
```bash
# 查看详细错误
pm2 logs social-app --lines 50

# 检查端口占用
netstat -tulpn | grep :3000

# 检查环境变量
pm2 env 0
```

### 数据库连接失败
```bash
# 检查数据库状态
sudo systemctl status postgresql

# 测试连接
pg_isready -h localhost -p 5432 -U social_user
```

### SSL 证书问题
```bash
# 检查证书状态
sudo certbot certificates

# 测试 SSL 配置
openssl s_client -connect yourdomain.com:443
```

## 📈 监控和告警

### 1. 系统监控
- 使用 `htop` 监控系统资源
- 配置 `logrotate` 管理日志文件
- 使用 `fail2ban` 防止恶意攻击

### 2. 应用监控
- PM2 内置监控：`pm2 monitor`
- 集成 Sentry 错误监控
- 配置 Grafana + Prometheus（高级）

### 3. 告警配置
```bash
# 添加监控脚本到 crontab
crontab -e

# 每5分钟检查一次应用状态
*/5 * * * * /var/www/social/deploy/monitor.sh
```

## 🔄 更新部署

### 代码更新
```bash
cd /var/www/social
git pull origin master
pnpm install
pnpm build
pm2 reload social-app
```

### 数据库迁移
```bash
npx prisma migrate deploy
```

### 零停机部署
```bash
# 使用 PM2 的优雅重启
pm2 reload social-app --update-env
```
