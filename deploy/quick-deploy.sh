#!/bin/bash

# 服务器端一键部署脚本
# 使用方法: 在服务器上运行 ./deploy/quick-deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始服务器端部署..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 1. 停止现有服务
echo "🛑 停止现有服务..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# 2. 清理旧文件
echo "🧹 清理旧文件..."
rm -rf .next
rm -rf node_modules

# 3. 安装依赖
echo "📦 安装依赖..."
pnpm install --frozen-lockfile

# 4. 生成 Prisma 客户端
echo "🗄️ 生成 Prisma 客户端..."
npx prisma generate

# 5. 数据库迁移
echo "🔄 执行数据库迁移..."
npx prisma migrate deploy

# 6. 构建应用
echo "🏗️ 构建应用..."
NODE_ENV=production pnpm build

# 7. 启动服务
echo "🚀 启动服务..."
pm2 start ecosystem.config.js --env production

# 8. 保存 PM2 配置
echo "💾 保存 PM2 配置..."
pm2 save

# 9. 显示服务状态
echo "📊 服务状态："
pm2 status

echo ""
echo "✅ 部署完成！"
echo ""
echo "🔍 检查服务状态："
echo "  pm2 status"
echo "  pm2 logs"
echo ""
echo "🌐 访问地址："
echo "  Next.js 应用: http://8.138.115.181"
echo "  WebSocket: ws://8.138.115.181:8080"
echo ""
echo "📝 查看日志："
echo "  pm2 logs social-app"
echo "  pm2 logs websocket-server"
