"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WebSocketServerTestPage() {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  const checkWebSocketServer = async () => {
    setServerStatus('checking');
    try {
      // 使用健康检查端点而不是broadcast端点
      const response = await fetch('http://localhost:8080/health');
      
      if (response.ok) {
        const data = await response.json();
        console.log('WebSocket server health:', data);
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      console.error('WebSocket server check failed:', error);
      setServerStatus('offline');
    }
  };

  const startWebSocketServer = () => {
    // 指示用户手动启动
    alert('请在终端中运行: node scripts/start-websocket.js');
  };

  useEffect(() => {
    checkWebSocketServer();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">WebSocket 服务器状态检查</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>服务器状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span>状态:</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                serverStatus === 'online' 
                  ? 'bg-green-100 text-green-800' 
                  : serverStatus === 'offline' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {serverStatus === 'online' ? '🟢 在线' : 
                 serverStatus === 'offline' ? '🔴 离线' : '🟡 检查中...'}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={checkWebSocketServer}>
                重新检查
              </Button>
              
              {serverStatus === 'offline' && (
                <Button onClick={startWebSocketServer} variant="outline">
                  启动说明
                </Button>
              )}
            </div>
            
            {serverStatus === 'offline' && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded">
                <h4 className="font-medium text-orange-800 mb-2">启动WebSocket服务器：</h4>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  node scripts/start-websocket.js
                </code>
                <p className="text-sm text-orange-700 mt-2">
                  在新的终端窗口中运行此命令，然后点击"重新检查"
                </p>
              </div>
            )}
            
            {serverStatus === 'online' && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-700">
                  ✅ WebSocket服务器正在运行，通知功能应该可以正常工作
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
