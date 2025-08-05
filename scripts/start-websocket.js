#!/usr/bin/env node
const { createServer } = require('http');
const { parse } = require('url');
const WebSocket = require('ws');
const cookie = require('cookie');

console.log('🚀 Starting WebSocket server...');

// 创建 HTTP 服务器
const server = createServer((req, res) => {
  const { pathname, query } = parse(req.url, true);
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 处理广播通知的HTTP请求
  if (pathname === '/broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { userId, notification } = JSON.parse(body);
        console.log('📡 Broadcasting notification via HTTP:', { userId, type: notification.type });
        
        const success = broadcastNotification(userId, notification);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success }));
      } catch (error) {
        console.error('❌ Error broadcasting via HTTP:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to broadcast' }));
      }
    });
    
    return;
  }
  
  // 健康检查端点
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      connectedUsers: connectedUsers.size,
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // 默认响应
  res.writeHead(404);
  res.end('Not Found');
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info) => {
    try {
      // 在开发环境中，我们暂时允许所有连接
      // 生产环境中可以加强认证
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ WebSocket connection accepted (dev mode)');
        return true;
      }
      
      const cookies = cookie.parse(info.req.headers.cookie || '');
      const token = cookies['auth-token'] || cookies['__session'] || cookies['__clerk_db_jwt'];
      
      if (!token) {
        console.log('❌ WebSocket connection rejected: No auth token');
        return false;
      }
      
      console.log('✅ WebSocket connection accepted with token');
      return true;
    } catch (error) {
      console.error('❌ WebSocket verification error:', error);
      return false;
    }
  }
});

// 存储连接的用户
const connectedUsers = new Map();

wss.on('connection', (ws, req) => {
  console.log('🔗 New WebSocket connection established');
  
  // 在开发环境中跳过认证检查
  if (process.env.NODE_ENV === 'production') {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies['auth-token'] || cookies['__session'] || cookies['__clerk_db_jwt'];
    
    if (!token) {
      console.log('❌ Closing connection: No auth token');
      ws.close(1008, 'Authentication required');
      return;
    }
  } else {
    console.log('🔓 Skipping auth check in development mode');
  }
  
  // 处理消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📩 Received message:', message);
      
      if (message.type === 'register') {
        // 注册用户连接
        connectedUsers.set(message.userId, ws);
        ws.userId = message.userId;
        console.log(`👤 User ${message.userId} registered for notifications`);
        
        // 发送确认消息
        ws.send(JSON.stringify({
          type: 'registered',
          message: 'Successfully registered for notifications'
        }));
      } else if (message.type === 'ping') {
        // 响应心跳
        ws.send(JSON.stringify({ type: 'pong' }));
        console.log('💓 Pong sent to client');
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
  
  // 处理连接关闭
  ws.on('close', (code, reason) => {
    if (ws.userId) {
      connectedUsers.delete(ws.userId);
      console.log(`👋 User ${ws.userId} disconnected (${code}: ${reason})`);
    } else {
      console.log(`👋 Anonymous user disconnected (${code}: ${reason})`);
    }
  });
  
  // 处理错误
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  // 发送心跳
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      // 不需要主动发ping，客户端会发送
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);
  
  ws.on('pong', () => {
    console.log('💓 Received pong from client');
  });
});

// 广播通知给指定用户
function broadcastNotification(userId, notification) {
  console.log(`🎯 Attempting to broadcast to user ${userId}...`);
  console.log(`👥 Currently connected users: ${Array.from(connectedUsers.keys()).join(', ')}`);
  
  const userWs = connectedUsers.get(userId);
  if (userWs && userWs.readyState === WebSocket.OPEN) {
    const message = {
      type: 'notification',
      data: notification
    };
    userWs.send(JSON.stringify(message));
    console.log(`📢 ✅ Successfully sent notification to user ${userId}:`, notification.type);
    console.log(`📤 Notification data:`, JSON.stringify(notification, null, 2));
    return true;
  } else if (userWs) {
    console.log(`⚠️ User ${userId} connection exists but WebSocket is not open (state: ${userWs.readyState})`);
  } else {
    console.log(`⚠️ User ${userId} not connected, notification not sent`);
  }
  return false;
}

// 广播未读数量更新
function broadcastUnreadCount(userId, count) {
  const userWs = connectedUsers.get(userId);
  if (userWs && userWs.readyState === WebSocket.OPEN) {
    userWs.send(JSON.stringify({
      type: 'unread_count',
      count: count
    }));
    console.log(`📊 Sent unread count to user ${userId}: ${count}`);
    return true;
  }
  return false;
}

// 导出广播函数供其他模块使用
global.broadcastNotification = broadcastNotification;
global.broadcastUnreadCount = broadcastUnreadCount;

// 启动服务器
const PORT = process.env.WEBSOCKET_PORT || 8080;
server.listen(PORT, () => {
  console.log(`🎯 WebSocket server running on ws://localhost:${PORT}`);
  console.log('📡 Waiting for connections...');
});

// 监听服务器错误
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, closing WebSocket server...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, closing WebSocket server...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});
