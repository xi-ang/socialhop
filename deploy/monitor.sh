#!/bin/bash

# 系统监控脚本
echo "📊 Social App 系统状态检查"
echo "=============================="

# 检查系统资源
echo "💻 系统资源："
echo "CPU 使用率: $(top -bn1 | grep load | awk '{printf "%.2f%%\t\t\n", $(NF-2)}')"
echo "内存使用: $(free -m | awk 'NR==2{printf "%.2f%%\t\t\n", $3*100/$2 }')"
echo "磁盘使用: $(df -h | awk '$NF=="/"{printf "%s\t\t\n", $5}')"

# 检查服务状态
echo ""
echo "🔧 服务状态："
echo "Nginx: $(systemctl is-active nginx)"
echo "PostgreSQL: $(systemctl is-active postgresql)"

# 检查 PM2 进程
echo ""
echo "📱 应用状态："
pm2 list | grep social-app

# 检查数据库连接
echo ""
echo "🗄️ 数据库连接："
pg_isready -h localhost -p 5432 -U social_user

# 检查磁盘空间
echo ""
echo "💾 磁盘空间："
df -h /

# 检查最近的错误日志
echo ""
echo "📝 最近的错误 (最后10条)："
tail -10 /var/log/pm2/social-app-error.log

# 检查 Nginx 访问日志统计
echo ""
echo "🌐 今日访问统计："
TODAY=$(date '+%d/%b/%Y')
grep "$TODAY" /var/log/nginx/social-app.access.log | wc -l | xargs echo "今日访问量:"

echo ""
echo "✅ 状态检查完成！"
