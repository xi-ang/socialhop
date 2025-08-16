#!/bin/bash

# SSL 证书安装脚本 (Let's Encrypt)
DOMAIN="yourdomain.com"  # 替换为你的域名
EMAIL="your-email@domain.com"  # 替换为你的邮箱

echo "🔒 安装 SSL 证书..."

# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 停止 Nginx
sudo systemctl stop nginx

# 获取证书
sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --no-eff-email

# 配置 Nginx
sudo cp /var/www/social/deploy/nginx-config /etc/nginx/sites-available/social-app

# 启用站点
sudo ln -sf /etc/nginx/sites-available/social-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
sudo nginx -t

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 设置证书自动续期
sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx"; } | sudo crontab -

echo "✅ SSL 证书安装完成！"
echo "🔍 检查证书状态：sudo certbot certificates"
echo "🔄 手动续期：sudo certbot renew"
