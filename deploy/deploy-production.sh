#!/bin/bash

# 生产环境部署脚本
# 使用方法: ./deploy-production.sh

set -e  # 遇到错误立即退出

echo "🚀 开始生产环境部署..."

# 1. 检查本地代码状态
echo "📋 检查本地代码状态..."
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ 本地有未提交的更改，请先提交或暂存"
    git status
    exit 1
fi

# 2. 检查当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "🌿 当前分支: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "⚠️ 警告：当前不在主分支，建议切换到 main 或 master 分支"
    read -p "是否继续部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 3. 推送到远程仓库
echo "📤 推送到远程仓库..."
git push origin $CURRENT_BRANCH

# 4. 本地构建测试
echo "🔨 本地构建测试..."
echo "📦 安装依赖..."
pnpm install --frozen-lockfile

echo "🗄️ 生成 Prisma 客户端..."
npx prisma generate

echo "🏗️ 构建应用..."
NODE_ENV=production pnpm build

echo "✅ 本地构建成功！"

# 5. 显示部署信息
echo ""
echo "🎯 部署准备完成！"
echo ""
echo "📋 下一步操作："
echo "1. 登录服务器: ssh root@8.138.115.181"
echo "2. 删除旧代码: rm -rf /var/www/social"
echo "3. 克隆新代码: git clone https://github.com/xi-ang/socialhop.git /var/www/social"
echo "4. 进入目录: cd /var/www/social"
echo "5. 复制环境变量: cp .env.production .env"
echo "6. 安装依赖: pnpm install --frozen-lockfile"
echo "7. 生成 Prisma 客户端: npx prisma generate"
echo "8. 数据库迁移: npx prisma migrate deploy"
echo "9. 构建应用: NODE_ENV=production pnpm build"
echo "10. 启动服务: pm2 start ecosystem.config.js --env production"
echo ""
echo "🔧 或者使用一键部署脚本:"
echo "   ./deploy/quick-deploy.sh"
echo ""
echo "⚠️ 注意事项："
echo "- 确保服务器上的 Node.js 版本 >= 18"
echo "- 确保服务器上的 pnpm 已安装"
echo "- 确保服务器上的 PM2 已安装"
echo "- 确保数据库连接正常"
echo "- 确保端口 3000 和 8080 未被占用"
