#!/bin/bash

# PostgreSQL 数据库安装脚本
echo "🗄️ 安装 PostgreSQL..."

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库用户和数据库
echo "📝 配置数据库..."
sudo -u postgres psql << EOF
CREATE USER social_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE social_prod OWNER social_user;
GRANT ALL PRIVILEGES ON DATABASE social_prod TO social_user;
\q
EOF

# 配置 PostgreSQL
echo "🔧 配置 PostgreSQL..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf

# 重启 PostgreSQL
sudo systemctl restart postgresql

echo "✅ PostgreSQL 安装完成！"
echo "📝 数据库连接信息："
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: social_prod"
echo "   Username: social_user"
echo "   Password: your_secure_password"
