#!/bin/bash

echo "🔄 重新部署 WebSocket 服务器..."

# 停止 WebSocket 服务器
echo "⏹️  停止 WebSocket 服务器..."
pm2 stop websocket-server
pm2 delete websocket-server

# 等待进程完全停止
sleep 2

# 重新启动 WebSocket 服务器
echo "🚀 重新启动 WebSocket 服务器..."
pm2 start ecosystem.config.js --only websocket-server

# 检查状态
echo "📊 检查 WebSocket 服务器状态..."
pm2 status websocket-server

# 查看日志
echo "📋 查看 WebSocket 服务器日志..."
pm2 logs websocket-server --lines 10

echo "✅ WebSocket 服务器重新部署完成！"
echo "🌐 服务器应该绑定到 0.0.0.0:8080"
