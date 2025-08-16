#!/bin/bash

# 🚀 一键安装服务器环境脚本
# 使用方法：wget https://raw.githubusercontent.com/你的仓库/deploy/setup.sh && chmod +x setup.sh && ./setup.sh

echo "🚀 开始配置阿里云服务器环境..."
echo "================================"

# 更新系统
echo "📦 步骤 1/8: 更新系统包..."
apt update && apt upgrade -y

# 安装基础工具
echo "🔧 步骤 2/8: 安装基础工具..."
apt install -y curl wget git vim htop ufw

# 配置防火墙
echo "🔒 步骤 3/8: 配置防火墙..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw allow 3000
ufw --force enable

# 安装 Node.js 18
echo "📦 步骤 4/8: 安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 验证 Node.js 安装
echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version)"

# 安装 pnpm
echo "📦 步骤 5/8: 安装 pnpm..."
npm install -g pnpm

# 安装 PM2
echo "📦 步骤 6/8: 安装 PM2..."
npm install -g pm2

# 安装 PostgreSQL
echo "🗄️ 步骤 7/8: 安装 PostgreSQL..."
apt install -y postgresql postgresql-contrib

# 启动并配置 PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# 创建数据库用户和数据库
echo "📝 配置数据库..."
sudo -u postgres psql << EOF
CREATE USER social_user WITH PASSWORD 'social_password_2024';
CREATE DATABASE social_prod OWNER social_user;
GRANT ALL PRIVILEGES ON DATABASE social_prod TO social_user;
ALTER USER social_user CREATEDB;
\q
EOF

# 安装 Nginx
echo "🌐 步骤 8/8: 安装 Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# 创建应用目录
echo "📁 创建应用目录..."
mkdir -p /var/www/social
mkdir -p /var/log/pm2

echo ""
echo "✅ 服务器环境安装完成！"
echo "================================"
echo "📋 安装的软件："
echo "   ✓ Node.js $(node --version)"
echo "   ✓ npm $(npm --version)"
echo "   ✓ pnpm $(pnpm --version)"
echo "   ✓ PM2 $(pm2 --version)"
echo "   ✓ PostgreSQL $(sudo -u postgres psql -c 'SELECT version();' | head -n 3 | tail -n 1)"
echo "   ✓ Nginx $(nginx -v 2>&1)"
echo ""
echo "🗄️ 数据库信息："
echo "   数据库名: social_prod"
echo "   用户名: social_user"
echo "   密码: social_password_2024"
echo "   连接地址: postgresql://social_user:social_password_2024@localhost:5432/social_prod"
echo ""
echo "🔗 接下来请："
echo "1. 上传您的项目代码"
echo "2. 配置环境变量"
echo "3. 部署应用"
