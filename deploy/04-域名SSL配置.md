# 🌐 域名和 SSL 配置指南

## 📝 域名配置

### 1. 购买域名
- 阿里云域名：https://wanwang.aliyun.com/
- 腾讯云域名：https://dnspod.cloud.tencent.com/
- Godaddy、Namecheap 等国外服务商

### 2. 域名解析设置
登录域名管理控制台，添加以下解析记录：

```
类型    主机记录    解析路线    记录值
A       @          默认        你的服务器IP
A       www        默认        你的服务器IP
```

例如：
- 记录类型：A
- 主机记录：@ （代表根域名）
- 记录值：47.xxx.xxx.xxx（你的阿里云服务器IP）

### 3. 验证域名解析
```bash
# 在本地电脑执行
ping 你的域名.com
nslookup 你的域名.com

# 应该返回你的服务器IP地址
```

## 🔒 SSL 证书配置

### 方法一：使用 Let's Encrypt 免费证书（推荐）

#### 安装 Certbot
```bash
# 在服务器执行
sudo apt install certbot python3-certbot-nginx
```

#### 获取证书
```bash
# 停止 Nginx（防止端口冲突）
sudo systemctl stop nginx

# 获取证书（替换为你的域名）
sudo certbot certonly --standalone -d 你的域名.com -d www.你的域名.com

# 按提示输入邮箱地址，同意条款
```

### 方法二：阿里云免费证书

1. 登录阿里云 SSL 证书控制台
2. 申请免费证书（DV SSL）
3. 域名验证（DNS 验证或文件验证）
4. 下载证书文件（Nginx 格式）
5. 上传到服务器 `/etc/ssl/certs/` 目录

## 🌐 Nginx 配置

### 创建 Nginx 配置文件
```bash
sudo vim /etc/nginx/sites-available/social-app
```

### 配置内容（复制以下内容）：
```nginx
server {
    listen 80;
    server_name 你的域名.com www.你的域名.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 你的域名.com www.你的域名.com;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/你的域名.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/你的域名.com/privkey.pem;
    
    # 反向代理到 Next.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/social-app /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 设置证书自动续期
```bash
# 添加到 crontab
sudo crontab -e

# 添加以下行（每月1号凌晨2点检查并续期）
0 2 1 * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

## ✅ 测试访问

1. 浏览器访问：`https://你的域名.com`
2. 检查 SSL 证书是否有效
3. 测试各项功能是否正常

## 🚨 常见问题

### 域名解析不生效
- 等待 DNS 传播（最长24小时）
- 检查域名解析记录是否正确
- 清除本地 DNS 缓存：`ipconfig /flushdns`（Windows）

### SSL 证书获取失败
- 确保域名已正确解析到服务器
- 检查防火墙是否开放 80、443 端口
- 暂时停止 Nginx 服务再尝试

### 502 Bad Gateway 错误
- 检查 PM2 应用是否正常运行：`pm2 status`
- 查看应用日志：`pm2 logs social-app`
- 确保应用监听在 3000 端口
