"use client";

import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function WebSocketTestPage() {
  const { 
    isConnected, 
    unreadCount, 
    notifications, 
    refreshUnreadCount, 
    sendMessage, 
    connect, 
    disconnect 
  } = useNotifications();

  const testPing = () => {
    console.log('📤 Sending ping...');
    sendMessage({ type: 'ping' });
  };

  const createTestNotification = async () => {
    console.log('📝 Creating test notification...');
    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('✅ Test notification created');
      } else {
        console.error('❌ Failed to create test notification');
      }
    } catch (error) {
      console.error('❌ Error creating test notification:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">WebSocket 连接测试</h1>
      
      {/* 连接状态卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            WebSocket 连接状态
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "已连接" : "未连接"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button onClick={connect} disabled={isConnected}>
              连接
            </Button>
            <Button onClick={disconnect} disabled={!isConnected} variant="destructive">
              断开连接
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>连接状态:</strong> {isConnected ? "✅ 已连接" : "❌ 未连接"}
            </div>
            <div>
              <strong>未读通知:</strong> {unreadCount}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 测试功能卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>测试功能</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button onClick={testPing} disabled={!isConnected}>
              发送 Ping
            </Button>
            <Button onClick={createTestNotification}>
              创建测试通知
            </Button>
            <Button onClick={refreshUnreadCount}>
              刷新未读数量
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            打开浏览器开发者工具查看 WebSocket 消息日志
          </p>
        </CardContent>
      </Card>

      {/* 调试信息 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>调试信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs font-mono bg-muted p-4 rounded">
            <div>WebSocket URL: ws://localhost:8080</div>
            <div>连接状态: {isConnected ? 'CONNECTED' : 'DISCONNECTED'}</div>
            <div>未读数量: {unreadCount}</div>
            <div>通知数量: {notifications.length}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
