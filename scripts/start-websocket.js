#!/usr/bin/env node

// WebSocket 服务进程
// 作用：
// - 维护用户到多连接的映射（多设备/多标签页）
// - 心跳保活与自动清理无效连接
// - 提供 /broadcast 与 /broadcast-unread 两个 HTTP 端点，供业务后端以 HTTP 方式驱动广播
// - 处理客户端消息：register、get_unread_count、ping/pong

// 手动加载.env文件
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim().replace(/"/g, '');
      }
    });
    console.log('✅ Environment variables loaded from .env file');
  }
} catch (error) {
  console.log('⚠️ Could not load .env file:', error.message);
}

const { createServer } = require('http');
const { parse } = require('url');
const WebSocket = require('ws');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');

console.log('🚀 Starting WebSocket server...');

// JWT验证函数 - 使用与项目相同的JWT配置
function verifyJwtToken(token) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    // console.log('🔍 Verifying JWT token with secret:', JWT_SECRET.substring(0, 10) + '...');
    // console.log('🔍 Token to verify:', token.substring(0, 20) + '...');
    
    const payload = jwt.verify(token, JWT_SECRET);
    // console.log('✅ JWT verification successful, payload:', payload);
    console.log('✅ JWT verification successful');
    return payload;
  } catch (error) {
    console.error('❌ JWT verification failed:', error.message);
    return null;
  }
}

// 创建 HTTP 服务器
const server = createServer((req, res) => {
  const { pathname, query } = parse(req.url, true);
  
  // 设置CORS头
  // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // 生产环境不设置该头，默认只允许同域
  }
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
      body += chunk.toString();  // 读取请求体
    });
    
    req.on('end', () => {
      try {
        const { userId, notification } = JSON.parse(body);
        // console.log('📡 Broadcasting notification via HTTP:', { userId, type: notification.type });
        
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
  
  // 处理广播未读数量的HTTP请求——使用场景：在“全部标记已读”/单条标记已读 等操作后也实时下发未读数到其它设备，
  if (pathname === '/broadcast-unread' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { userId } = JSON.parse(body);
        if (!userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing userId' }));
          return;
        }
        
        const count = await getUnreadCountFromDB(userId);
        const success = broadcastUnreadCount(userId, count);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success, count }));
      } catch (error) {
        console.error('❌ Error broadcasting unread count via HTTP:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to broadcast unread count' }));
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
  // 握手阶段验证 
  verifyClient: (info) => {
    try {
      console.log('🤝 WebSocket handshake - checking credentials...');
      
      // 首先尝试从 URL query 参数获取 token (localStorage -> WebSocket URL)
      const url = new URL(info.req.url, `http://${info.req.headers.host}`);
      let token = url.searchParams.get('token');
      
      // // 如果 URL 中没有 token，尝试从 cookie 获取 (向后兼容)
      // if (!token) {
      //   const cookies = cookie.parse(info.req.headers.cookie || '');
      //   token = cookies['auth-token'];
      // }
      
      if (!token) {
        console.log('❌ WebSocket connection rejected: No auth token in URL or cookie');
        return false;
      }
      
      console.log('🎫 Found auth token, verifying...');
      const payload = verifyJwtToken(token);
      if (!payload?.userId) {
        console.log('❌ WebSocket connection rejected: Invalid JWT token or missing userId');
        return false;
      }
      
      console.log('✅ WebSocket connection accepted for user:', payload.userId);
      return true;
    } catch (error) {
      console.error('❌ WebSocket verification error:', error);
      return false;
    }
  }
});

// 存储连接的用户 - 改为支持多设备连接
const connectedUsers = new Map(); // userId -> Set<WebSocket>

wss.on('connection', (ws, req) => {
  console.log('🔗 New WebSocket connection established');
  
  // 初始化心跳检测状态
  ws.isAlive = true;
  
  // 连接建立后的二次验证（生产环境）
  if (process.env.NODE_ENV === 'production') {
    // 首先尝试从 URL query 参数获取 token
    const url = new URL(req.url, `http://${req.headers.host}`);
    let token = url.searchParams.get('token');
    
    // // 如果 URL 中没有 token，尝试从 cookie 获取 (向后兼容)
    // if (!token) {
    //   const cookies = cookie.parse(req.headers.cookie || '');
    //   token = cookies['auth-token'];
    // }
    
    if (!token) {
      console.log('❌ Closing connection: No auth token');
      ws.close(1008, 'Authentication required');
      return;
    }
    
    const payload = verifyJwtToken(token);
    if (!payload?.userId) {
      console.log('❌ Closing connection: Invalid JWT token');
      ws.close(1008, 'Invalid token');
      return;
    }
    
    ws.userId = payload.userId; // 保存用户ID到连接对象
    console.log('✅ Production mode: JWT token verified for user');
  } else {
    console.log('🔓 Development mode: Simplified auth check');
  }
  
  // 处理消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📩 Received message:', message);
      
      if (message.type === 'register') {
        // 注册用户连接 - 支持多设备
        if (!connectedUsers.has(message.userId)) {
          connectedUsers.set(message.userId, new Set());
        }
        connectedUsers.get(message.userId).add(ws);
        ws.userId = message.userId;
        // console.log(`👤 User ${message.userId} registered for notifications (${connectedUsers.get(message.userId).size} devices)`);
        
        // 发送确认消息
        ws.send(JSON.stringify({
          type: 'registered',
          message: 'Successfully registered for notifications'
        }));
      } else if (message.type === 'ping') {
        // 响应心跳
        ws.send(JSON.stringify({ type: 'pong' }));
        console.log('💓 Pong sent to client');
      } else if (message.type === 'get_unread_count') {
        // 处理获取未读数量请求
        if (ws.userId) {
          console.log(`📊 Processing get_unread_count request for user: ${ws.userId}`);
          getUnreadCountFromDB(ws.userId)
            .then(count => {
              broadcastUnreadCount(ws.userId, count);
            })
            .catch(error => {
              console.error('❌ Error getting unread count:', error);
              broadcastUnreadCount(ws.userId, 0); // 出错时发送0
            });
        } else {
          console.warn('⚠️ get_unread_count request without valid userId');
        }
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
  
  // 处理连接关闭
  ws.on('close', (code, reason) => {
    if (ws.userId) {
      const userConnections = connectedUsers.get(ws.userId);
      if (userConnections) {
        userConnections.delete(ws);
        if (userConnections.size === 0) {
          connectedUsers.delete(ws.userId);
          console.log(`👋 User ${ws.userId} fully disconnected (${code}: ${reason})`);
        } else {
          console.log(`👋 User ${ws.userId} device disconnected, ${userConnections.size} devices remaining (${code}: ${reason})`);
        }
      }
    } else {
      console.log(`👋 Anonymous user disconnected (${code}: ${reason})`);
    }
  });
  
  // 处理错误
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  // 心跳检测 - 收到pong时重置存活状态
  ws.on('pong', () => {
    console.log('💓 Received pong from client');
    ws.isAlive = true;
  });
});

// 全局心跳检测定时器
setInterval(() => {
  console.log('🔍 Performing heartbeat check...');
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log(`💀 Client failed heartbeat check, terminating connection for user: ${ws.userId || 'unknown'}`);
      
      // 从用户连接集合中移除此连接
      if (ws.userId) {
        const userConnections = connectedUsers.get(ws.userId);
        if (userConnections) {
          userConnections.delete(ws);
          if (userConnections.size === 0) {
            connectedUsers.delete(ws.userId);
          }
        }
      }
      
      ws.terminate(); // 强制关闭连接
      return;
    }
    
    // 重置存活状态并发送ping
    ws.isAlive = false;
    ws.ping();
    console.log(`🏓 Sent ping to user: ${ws.userId || 'unknown'}`);
  });
}, 30000); // 30秒检查一次

// 从数据库获取未读数量（纯数据获取函数）
async function getUnreadCountFromDB(userId) {
  try {
    console.log(`📊 Fetching unread count from DB for user: ${userId}`);
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        read: false,
      },
    });
    
    console.log(`📊 DB query result for user ${userId}: ${unreadCount} unread notifications`);
    await prisma.$disconnect();
    return unreadCount;
  } catch (error) {
    console.error('❌ Error fetching unread count from DB:', error);
    throw error;
  }
}

// 广播通知给指定用户 - 支持多设备
function broadcastNotification(userId, notification) {
  console.log(`🎯 Attempting to broadcast to user ${userId}...`);
  console.log(`👥 Currently connected users: ${Array.from(connectedUsers.keys()).join(', ')}`);
  
  const userConnections = connectedUsers.get(userId);
  if (userConnections && userConnections.size > 0) {
    const message = {
      type: 'notification',
      data: notification
    };
    
    let successCount = 0;
    userConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        successCount++;
      } else {
        // 清理无效连接
        userConnections.delete(ws);
      }
    });
    
    console.log(`📢 ✅ Successfully sent notification to ${successCount}/${userConnections.size} devices for user ${userId}:`, notification.type);
    console.log(`📤 Notification data:`, JSON.stringify(notification, null, 2));
    return successCount > 0;
  } else {
    console.log(`⚠️ User ${userId} not connected, notification not sent`);
    return false;
  }
}

// 广播未读数量更新 - 支持多设备
function broadcastUnreadCount(userId, count) {
  const userConnections = connectedUsers.get(userId);
  if (userConnections && userConnections.size > 0) {
    const message = {
      type: 'unread_count',
      count: count
    };
    
    let successCount = 0;
    userConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        successCount++;
      } else {
        // 清理无效连接
        userConnections.delete(ws);
      }
    });
    
    console.log(`📊 Sent unread count to ${successCount}/${userConnections.size} devices for user ${userId}: ${count}`);
    return successCount > 0;
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
