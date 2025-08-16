#!/bin/bash

# 阿里云服务器初始化脚本
echo "🚀 开始阿里云服务器初始化..."

# 更新系统
echo "📦 更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装基础工具
echo "🔧 安装基础工具..."
sudo apt install -y curl wget git vim htop

# 安装 Node.js 18
echo "📦 安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm
echo "📦 安装 pnpm..."
npm install -g pnpm

# 安装 PM2
echo "📦 安装 PM2..."
npm install -g pm2

# 安装 Nginx
echo "🌐 安装 Nginx..."
sudo apt install -y nginx

# 配置防火墙
echo "🔒 配置防火墙..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 创建应用目录
echo "📁 创建应用目录..."
sudo mkdir -p /var/www/social
sudo chown -R $USER:$USER /var/www/social

echo "✅ 服务器初始化完成！"
echo "🔧 请确保在阿里云控制台开放以下端口："
echo "   - 22 (SSH)"
echo "   - 80 (HTTP)"
echo "   - 443 (HTTPS)"
echo "   - 3000 (应用端口，可选)"
