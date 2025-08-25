#!/bin/bash

echo "🚀 开始完整重新部署..."

# 1. 停止所有 PM2 进程
echo "⏹️  停止所有 PM2 进程..."
pm2 stop all
pm2 delete all

# 2. 等待进程完全停止
echo "⏳ 等待进程停止..."
sleep 3

# 3. 清理可能的端口占用
echo "🧹 清理端口占用..."
pkill -f "node.*start-websocket.js" || true
pkill -f "node.*server.js" || true

# 4. 重新启动 WebSocket 服务器
echo "🔌 启动 WebSocket 服务器..."
pm2 start ecosystem.config.js --only websocket-server

# 5. 等待 WebSocket 服务器启动
echo "⏳ 等待 WebSocket 服务器启动..."
sleep 3

# 6. 检查 WebSocket 服务器状态
echo "📊 检查 WebSocket 服务器状态..."
pm2 status websocket-server

# 7. 启动主应用
echo "🌐 启动主应用..."
pm2 start ecosystem.config.js --only social-app

# 8. 等待主应用启动
echo "⏳ 等待主应用启动..."
sleep 5

# 9. 检查所有服务状态
echo "📊 检查所有服务状态..."
pm2 status

# 10. 检查端口监听状态
echo "🔍 检查端口监听状态..."
netstat -tlnp | grep -E ":(3000|8080)"

# 11. 查看 WebSocket 服务器日志
echo "📋 WebSocket 服务器日志:"
pm2 logs websocket-server --lines 5

# 12. 查看主应用日志
echo "📋 主应用日志:"
pm2 logs social-app --lines 5

echo "✅ 完整重新部署完成！"
echo "🌐 主应用应该运行在 http://8.138.115.181"
echo "🔌 WebSocket 服务器应该运行在 ws://8.138.115.181:8080"
echo ""
echo "💡 如果仍有问题，请检查："
echo "   1. 防火墙设置 (firewall-cmd --list-all)"
echo "   2. Nginx 状态 (systemctl status nginx)"
echo "   3. 环境变量文件 (.env.production)"
