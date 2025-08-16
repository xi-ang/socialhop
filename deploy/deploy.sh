#!/bin/bash

# 🚀 应用一键部署脚本
# 在服务器的 /var/www/social 目录执行

echo "🚀 开始部署 Social App..."
echo "=========================="

# 检查是否在正确目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录执行此脚本"
    exit 1
fi

# 检查环境变量文件
if [ ! -f ".env.production" ]; then
    echo "❌ 错误：请先配置 .env.production 文件"
    echo "� 请复制 .env.production.template 并修改相应配置"
    exit 1
fi

# 更新代码（如果是 git 仓库）
if [ -d ".git" ]; then
    echo "📦 步骤 0/6: 更新代码..."
    git pull origin master
fi

# 安装依赖
echo "📦 步骤 1/6: 安装项目依赖..."
pnpm install --frozen-lockfile

# 生成 Prisma 客户端
echo "🔧 步骤 2/6: 生成 Prisma 客户端..."
npx prisma generate

# 运行数据库迁移
echo "🗄️ 步骤 3/6: 运行数据库迁移..."
npx prisma migrate deploy

# 构建应用
echo "🔨 步骤 4/6: 构建生产版本..."
pnpm build

# 停止旧的进程
echo "⏹️ 步骤 5/6: 停止旧进程..."
pm2 delete social-app 2>/dev/null || true

# 启动新进程
echo "🚀 步骤 6/6: 启动应用..."
pm2 start ecosystem.config.js --env production

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup

echo ""
echo "✅ 部署完成！"
echo "=============="
echo "� 应用状态："
pm2 status

echo ""
echo "� 访问地址："
echo "   HTTP: http://$(curl -s http://checkip.amazonaws.com):3000"
echo "   配置域名后: https://你的域名.com"
echo ""
echo "📋 常用命令："
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs social-app"
echo "   重启应用: pm2 restart social-app"
echo "   停止应用: pm2 stop social-app"
