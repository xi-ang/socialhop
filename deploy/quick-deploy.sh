#!/bin/bash

# 🚀 社交应用一键部署脚本
# 在全新的阿里云服务器上运行此脚本即可完成所有配置

echo "🎯 社交应用一键部署开始..."
echo "=================================="

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用 root 用户运行此脚本"
    echo "💡 使用命令：sudo ./quick-deploy.sh"
    exit 1
fi

# 显示服务器信息
echo "📊 服务器信息："
echo "   IP地址: $(curl -s http://checkip.amazonaws.com)"
echo "   系统: $(lsb_release -d | cut -f2)"
echo "   内存: $(free -h | awk '/^Mem/ {print $2}')"
echo ""

# 询问用户配置
echo "📝 请选择代码获取方式："
echo "1. 从 GitHub 克隆（推荐）"
echo "2. 手动上传代码文件"
echo "3. 稍后手动配置"
read -p "请选择 [1-3]: " CODE_METHOD

case $CODE_METHOD in
    1)
        read -p "🔗 请输入您的 GitHub 仓库地址（默认：https://github.com/xi-ang/socialhop.git）: " REPO_URL
        REPO_URL=${REPO_URL:-"https://github.com/xi-ang/socialhop.git"}
        USE_GIT=true
        ;;
    2)
        echo "📦 请稍后使用以下命令上传代码："
        echo "   scp -r '本地项目路径' root@$(curl -s http://checkip.amazonaws.com):/var/www/social/"
        echo "   或使用 SFTP 工具上传"
        USE_GIT=false
        ;;
    3)
        echo "⏭️ 跳过代码部署，稍后手动配置"
        USE_GIT=skip
        ;;
    *)
        echo "❌ 无效选择，默认使用 GitHub 方式"
        REPO_URL="https://github.com/xi-ang/socialhop.git"
        USE_GIT=true
        ;;
esac

read -p "🌐 请输入您的域名（没有请直接回车）: " DOMAIN_NAME

read -p "🔑 请输入您的 UploadThing Secret: " UPLOADTHING_SECRET
if [ -z "$UPLOADTHING_SECRET" ]; then
    echo "⚠️ 警告：未设置 UploadThing Secret，图片上传功能将无法使用"
fi

read -p "🆔 请输入您的 UploadThing App ID: " UPLOADTHING_APP_ID
if [ -z "$UPLOADTHING_APP_ID" ]; then
    echo "⚠️ 警告：未设置 UploadThing App ID，图片上传功能将无法使用"
fi

echo ""
echo "🚀 开始自动部署..."

# 1. 更新系统
echo "📦 1/7: 更新系统..."
apt update && apt upgrade -y

# 2. 安装基础工具
echo "🔧 2/7: 安装基础工具..."
apt install -y curl wget git vim htop ufw

# 3. 配置防火墙
echo "🔒 3/7: 配置防火墙..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw allow 3000
ufw --force enable

# 4. 安装 Node.js 环境
echo "📦 4/7: 安装 Node.js 环境..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g pnpm pm2

# 5. 安装数据库
echo "🗄️ 5/7: 安装 PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# 创建数据库
sudo -u postgres psql << EOF
CREATE USER social_user WITH PASSWORD 'social_password_2024';
CREATE DATABASE social_prod OWNER social_user;
GRANT ALL PRIVILEGES ON DATABASE social_prod TO social_user;
ALTER USER social_user CREATEDB;
\q
EOF

# 6. 部署应用
echo "🚀 6/7: 部署应用..."
mkdir -p /var/www/social
cd /var/www/social

if [ "$USE_GIT" = "true" ]; then
    echo "📦 从 GitHub 克隆代码..."
    git clone $REPO_URL .
elif [ "$USE_GIT" = "false" ]; then
    echo "⏳ 等待用户上传代码..."
    echo "请在另一个终端执行："
    echo "scp -r '您的项目路径' root@$(curl -s http://checkip.amazonaws.com):/var/www/social/"
    echo ""
    read -p "代码上传完成后，按 Enter 继续..."
    
    # 检查是否有 package.json
    if [ ! -f "package.json" ]; then
        echo "❌ 未找到 package.json 文件，请确保代码已正确上传到 /var/www/social/"
        exit 1
    fi
elif [ "$USE_GIT" = "skip" ]; then
    echo "⏭️ 跳过代码部署，仅安装环境..."
    echo "请稍后手动上传代码并运行部署脚本"
    echo ""
    echo "手动部署步骤："
    echo "1. 上传代码到 /var/www/social/"
    echo "2. 配置 .env.production 文件"
    echo "3. 运行: cd /var/www/social && ./deploy/deploy.sh"
    echo ""
    echo "✅ 环境安装完成！"
    exit 0
fi

# 生成环境变量文件
cat > .env.production << EOF
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=${DOMAIN_NAME:+https://$DOMAIN_NAME}${DOMAIN_NAME:-http://$(curl -s http://checkip.amazonaws.com):3000}
NEXTAUTH_URL=${DOMAIN_NAME:+https://$DOMAIN_NAME}${DOMAIN_NAME:-http://$(curl -s http://checkip.amazonaws.com):3000}
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
DATABASE_URL="postgresql://social_user:social_password_2024@localhost:5432/social_prod?schema=public"
UPLOADTHING_SECRET=$UPLOADTHING_SECRET
UPLOADTHING_APP_ID=$UPLOADTHING_APP_ID
EOF

# 安装依赖和构建
pnpm install --frozen-lockfile
npx prisma generate
npx prisma migrate deploy
pnpm build

# 启动应用
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 7. 配置 Nginx（如果有域名）
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "🌐 7/7: 配置 Nginx 和 SSL..."
    apt install -y nginx certbot python3-certbot-nginx
    
    # 创建 Nginx 配置
    cat > /etc/nginx/sites-available/social-app << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/social-app /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 先启动临时服务获取证书
    systemctl stop nginx
    certbot certonly --standalone -d $DOMAIN_NAME -d www.$DOMAIN_NAME --agree-tos --no-eff-email
    
    # 更新 Nginx 配置添加 SSL
    sed -i "/listen 443 ssl http2;/a\\    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;\\n    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;" /etc/nginx/sites-available/social-app
    
    nginx -t && systemctl start nginx && systemctl enable nginx
    
    # 设置证书自动续期
    (crontab -l 2>/dev/null; echo "0 2 1 * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
else
    echo "🌐 7/7: 跳过域名配置..."
fi

echo ""
echo "🎉 部署完成！"
echo "=================="
echo "📱 应用信息："
echo "   状态: $(pm2 list | grep social-app | awk '{print $18}')"
echo "   进程: $(pm2 list | grep social-app | awk '{print $4}')"
echo ""
echo "🔗 访问地址："
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "   HTTPS: https://$DOMAIN_NAME"
    echo "   HTTP:  http://$DOMAIN_NAME (自动跳转到HTTPS)"
else
    echo "   HTTP: http://$(curl -s http://checkip.amazonaws.com):3000"
fi
echo ""
echo "🗄️ 数据库信息："
echo "   连接串: postgresql://social_user:social_password_2024@localhost:5432/social_prod"
echo ""
echo "📋 管理命令："
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs social-app"
echo "   重启应用: pm2 restart social-app"
echo ""
echo "✅ 部署成功！您的社交应用已经运行在阿里云上了！"
