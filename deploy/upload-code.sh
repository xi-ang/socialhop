#!/bin/bash

# 📦 代码上传脚本（在本地电脑运行）
# 用于将项目代码上传到阿里云服务器

echo "📦 代码上传工具"
echo "=================="

# 检查参数
if [ $# -lt 1 ]; then
    echo "❌ 用法：$0 <服务器IP地址> [项目路径]"
    echo ""
    echo "示例："
    echo "  $0 47.xxx.xxx.xxx"
    echo "  $0 47.xxx.xxx.xxx /path/to/your/project"
    echo ""
    exit 1
fi

SERVER_IP=$1
PROJECT_PATH=${2:-$(pwd)}

echo "🔍 检查项目目录..."
if [ ! -f "$PROJECT_PATH/package.json" ]; then
    echo "❌ 错误：在 $PROJECT_PATH 中未找到 package.json 文件"
    echo "💡 请确保在 Next.js 项目目录中运行此脚本"
    exit 1
fi

echo "✅ 找到 Next.js 项目：$PROJECT_PATH"
echo "📡 目标服务器：$SERVER_IP"
echo ""

# 询问用户确认
read -p "🤔 确认上传项目到服务器？ [y/N]: " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ 取消上传"
    exit 0
fi

echo "📦 开始上传代码..."

# 创建临时排除文件
EXCLUDE_FILE=$(mktemp)
cat > $EXCLUDE_FILE << 'EOF'
node_modules/
.next/
.git/
.env*
!.env.example
dist/
build/
coverage/
.nyc_output/
.DS_Store
*.log
.vscode/
.idea/
*.swp
*.swo
*~
EOF

# 使用 rsync 上传（如果可用）
if command -v rsync >/dev/null 2>&1; then
    echo "🚀 使用 rsync 上传（推荐方式）..."
    rsync -avz --progress \
          --exclude-from=$EXCLUDE_FILE \
          "$PROJECT_PATH/" \
          "root@$SERVER_IP:/var/www/social/"
    
    UPLOAD_SUCCESS=$?
else
    echo "🚀 使用 scp 上传..."
    
    # 创建临时压缩包
    TEMP_DIR=$(mktemp -d)
    ARCHIVE_NAME="social-app-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    echo "📦 压缩项目文件..."
    tar -czf "$TEMP_DIR/$ARCHIVE_NAME" \
        --exclude-from=$EXCLUDE_FILE \
        -C "$(dirname "$PROJECT_PATH")" \
        "$(basename "$PROJECT_PATH")"
    
    echo "📤 上传压缩包..."
    scp "$TEMP_DIR/$ARCHIVE_NAME" "root@$SERVER_IP:/tmp/"
    
    if [ $? -eq 0 ]; then
        echo "📂 在服务器解压..."
        ssh "root@$SERVER_IP" << EOF
mkdir -p /var/www/social
cd /var/www/social
rm -rf * 2>/dev/null || true
tar -xzf /tmp/$ARCHIVE_NAME --strip-components=1
rm /tmp/$ARCHIVE_NAME
chown -R root:root /var/www/social
echo "✅ 代码解压完成"
EOF
        UPLOAD_SUCCESS=$?
    else
        UPLOAD_SUCCESS=1
    fi
    
    # 清理临时文件
    rm -rf "$TEMP_DIR"
fi

# 清理排除文件
rm "$EXCLUDE_FILE"

if [ $UPLOAD_SUCCESS -eq 0 ]; then
    echo ""
    echo "✅ 代码上传成功！"
    echo "===================="
    echo ""
    echo "📋 接下来的步骤："
    echo "1. 连接到服务器："
    echo "   ssh root@$SERVER_IP"
    echo ""
    echo "2. 进入项目目录："
    echo "   cd /var/www/social"
    echo ""
    echo "3. 配置环境变量："
    echo "   cp deploy/.env.production.template .env.production"
    echo "   vim .env.production  # 填入真实配置"
    echo ""
    echo "4. 运行部署脚本："
    echo "   chmod +x deploy/deploy.sh"
    echo "   ./deploy/deploy.sh"
    echo ""
    echo "🎯 或者直接运行一键部署："
    echo "   ./deploy/quick-deploy.sh"
    echo ""
else
    echo ""
    echo "❌ 代码上传失败！"
    echo "=================="
    echo ""
    echo "🔍 可能的原因："
    echo "1. 服务器 IP 地址错误"
    echo "2. SSH 连接失败（检查密钥或密码）"
    echo "3. 网络连接问题"
    echo "4. 服务器磁盘空间不足"
    echo ""
    echo "🛠️ 解决方法："
    echo "1. 检查服务器连接：ssh root@$SERVER_IP"
    echo "2. 确保服务器有足够空间：df -h"
    echo "3. 检查防火墙设置"
    echo ""
fi
