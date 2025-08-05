import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { JwtService } from '@/lib/jwt';
import { parse } from 'cookie';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class NotificationWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket[]> = new Map();

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ 
      port,
      verifyClient: this.verifyClient.bind(this)
    });
    
    this.setupServer();
    console.log(`🔔 WebSocket notification server running on port ${port}`);
  }

  private verifyClient(info: { req: IncomingMessage }): boolean {
    try {
      const cookies = parse(info.req.headers.cookie || '');
      const token = cookies['auth-token'];
      
      if (!token) return false;
      
      const payload = JwtService.verify(token);
      return !!payload?.userId;
    } catch {
      return false;
    }
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log('📱 New WebSocket connection');
      
      const authWs = ws as AuthenticatedWebSocket;
      
      // 认证用户
      this.authenticateUser(authWs, req);
      
      // 设置心跳检测
      authWs.isAlive = true;
      authWs.on('pong', () => {
        authWs.isAlive = true;
      });

      // 处理消息
      authWs.on('message', (data: Buffer) => {
        this.handleMessage(authWs, data);
      });

      // 处理断开连接
      authWs.on('close', () => {
        this.removeClient(authWs);
        console.log('📱 WebSocket connection closed');
      });

      authWs.on('error', (error: Error) => {
        console.error('❌ WebSocket error:', error);
        this.removeClient(authWs);
      });
    });

    // 心跳检测定时器
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const authWs = ws as AuthenticatedWebSocket;
        if (!authWs.isAlive) {
          authWs.terminate();
          this.removeClient(authWs);
          return;
        }
        authWs.isAlive = false;
        authWs.ping();
      });
    }, 30000); // 30秒心跳检测
  }

  private authenticateUser(ws: AuthenticatedWebSocket, req: IncomingMessage): void {
    try {
      const cookies = parse(req.headers.cookie || '');
      const token = cookies['auth-token'];
      
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      const payload = JwtService.verify(token);
      if (!payload?.userId) {
        ws.close(1008, 'Invalid token');
        return;
      }

      ws.userId = payload.userId;
      this.addClient(ws);
      
      // 发送连接成功消息
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established',
        userId: ws.userId
      }));

      console.log(`✅ User ${ws.userId} authenticated`);
    } catch (error) {
      console.error('❌ Authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  private addClient(ws: AuthenticatedWebSocket): void {
    if (!ws.userId) return;
    
    if (!this.clients.has(ws.userId)) {
      this.clients.set(ws.userId, []);
    }
    this.clients.get(ws.userId)!.push(ws);
  }

  private removeClient(ws: AuthenticatedWebSocket): void {
    if (!ws.userId) return;
    
    const userClients = this.clients.get(ws.userId);
    if (userClients) {
      const index = userClients.indexOf(ws);
      if (index > -1) {
        userClients.splice(index, 1);
      }
      
      if (userClients.length === 0) {
        this.clients.delete(ws.userId);
      }
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        case 'get_unread_count':
          this.sendUnreadCount(ws);
          break;
        default:
          console.log('📨 Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Message handling error:', error);
    }
  }

  private async sendUnreadCount(ws: AuthenticatedWebSocket): Promise<void> {
    if (!ws.userId) return;
    
    try {
      // 这里需要从数据库获取未读通知数量
      const unreadCount = await this.getUnreadNotificationCount(ws.userId);
      
      ws.send(JSON.stringify({
        type: 'unread_count',
        count: unreadCount
      }));
    } catch (error) {
      console.error('❌ Error sending unread count:', error);
    }
  }

  // 发送通知给特定用户
  public sendNotification(userId: string, notification: any): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.length === 0) {
      console.log(`📭 No active connections for user ${userId}`);
      return;
    }

    const message = JSON.stringify({
      type: 'notification',
      data: notification
    });

    userClients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });

    console.log(`🔔 Notification sent to user ${userId}`);
  }

  // 发送未读数量更新
  public sendUnreadCountUpdate(userId: string, count: number): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.length === 0) return;

    const message = JSON.stringify({
      type: 'unread_count',
      count: count
    });

    userClients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  }

  // 获取未读通知数量
  private async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      // 动态导入 prisma 避免在客户端环境中引入
      const { default: prisma } = await import('@/lib/prisma');
      
      const count = await prisma.notification.count({
        where: {
          userId: userId,
          read: false,
        },
      });
      
      return count;
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      return 0;
    }
  }

  // 获取连接的用户数量
  public getConnectedUsersCount(): number {
    return this.clients.size;
  }

  // 关闭服务器
  public close(): void {
    this.wss.close();
  }
}

// 创建全局 WebSocket 服务器实例
let wsServer: NotificationWebSocketServer | null = null;

export function getWebSocketServer(): NotificationWebSocketServer {
  if (!wsServer) {
    wsServer = new NotificationWebSocketServer(8080);
  }
  return wsServer;
}

export default NotificationWebSocketServer;
