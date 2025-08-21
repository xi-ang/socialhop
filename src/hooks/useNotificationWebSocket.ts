"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { TokenManager } from '@/lib/token-manager';
import { apiClient } from '@/lib/api-client';

interface NotificationData {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW';
  creator: {
    id: string;
    name: string;
    username: string;
    image?: string;
  };
  post?: {
    id: string;
    content: string;
    image?: string;
  };
  createdAt: string;
  read: boolean;
}

interface WebSocketMessage {
  type: 'connected' | 'registered' | 'notification' | 'unread_count' | 'pong';
  data?: NotificationData;
  count?: number;
  message?: string;
  userId?: string;
}

// WebSocket 客户端 Hook
// 作用：统一管理连接、心跳、自动重连与收发；不直接改 Redux，由全局接驳器 DataLoader 消费此 Hook 的输出
export function useNotificationWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const wsRef = useRef<WebSocket | null>(null);  // 持久化 WebSocket 实例，确保在组件重新渲染时不会丢失
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);  // 重连尝试次数

  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000; // 3秒

  const connect = () => {
    // 如果没有用户或已经连接，则不进行连接
    if (!user?.id) {
      console.log('⚠️ WebSocket connection skipped: No user ID');
      return;
    }

    // 检查是否有有效的 token
    const token = TokenManager.getToken();
    if (!token || TokenManager.isTokenExpired()) {
      console.log('⚠️ WebSocket connection skipped: No valid token');
      return;
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocket already connected');
      return;
    }

    // 如果正在连接中，也不要重复连接
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('⚠️ WebSocket already connecting...');
      return;
    }

    try {
      console.log('🚀 Connecting to WebSocket server for user:', user.id);
      
      // 根据环境选择 WebSocket 服务器地址
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
                   (process.env.NODE_ENV === 'production' 
                     ? `ws://${window.location.hostname}:8080` 
                     : 'ws://localhost:8080');
      
      console.log('📡 WebSocket URL:', wsUrl);
      
      // 连接到 WebSocket 服务器，并在 URL 中传递 token
      const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔗 WebSocket connected successfully');
        setIsConnected(true);
        setReconnectAttempts(0);
        
        // 注册用户以接收通知
        if (user) {
          ws.send(JSON.stringify({
            type: 'register',
            userId: user.id
          }));
          console.log('📝 Registering user for notifications:', user.id);
        }
        
        // 连接成功后请求未读数量
        ws.send(JSON.stringify({ type: 'get_unread_count' }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              console.log('✅ WebSocket authenticated for user:', message.userId);
              break;
              
            case 'registered':
              console.log('✅ User registered for notifications:', message.message);
              break;
              
            case 'notification':
              if (message.data) {
                console.log('🔔 New notification received:', message.data);
                setNotifications(prev => [message.data!, ...prev]);
                // 新通知到达时，请求最新的未读数量（而不是前端计算-之前的代码）
                if (!message.data.read) {
                  console.log('📊 New unread notification received, requesting updated count from server');
                  sendMessage({ type: 'get_unread_count' });
                }
                // 显示浏览器通知（如果用户允许）
                showBrowserNotification(message.data);
              }
              break;
              
            case 'unread_count':
              console.log('📊 Unread count updated:', message.count);
              setUnreadCount(message.count || 0);
              break;
              
            case 'pong':
              // 心跳响应
              break;
              
            default:
              console.log('📨 Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('📱 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // 如果不是正常关闭，尝试重连
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          console.log(`🔄 Attempting to reconnect... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    console.log('🔌 Disconnecting WebSocket...');
    
    // 清除重连定时器
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // 关闭WebSocket连接
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setReconnectAttempts(0);
  };

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const refreshUnreadCount = async () => {
    // 首先尝试通过WebSocket获取
    if (isConnected) {
      sendMessage({ type: 'get_unread_count' });
    } else {
      // 如果WebSocket未连接，通过API获取
      try {
        const data = await apiClient.notifications.getUnreadCount() as any;
        if (data.success) {
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    }
  };

  // 显示浏览器通知
  const showBrowserNotification = (notification: NotificationData) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const title = getNotificationTitle(notification);
      const body = getNotificationBody(notification);
      
      new Notification(title, {
        body,
        icon: notification.creator.image || '/avatar.png',
        tag: notification.id, // 防止重复通知
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showBrowserNotification(notification);
        }
      });
    }
  };

  const getNotificationTitle = (notification: NotificationData): string => {
    switch (notification.type) {
      case 'LIKE':
        return `${notification.creator.name || notification.creator.username} 点赞了你的帖子`;
      case 'COMMENT':
        return `${notification.creator.name || notification.creator.username} 评论了你的帖子`;
      case 'FOLLOW':
        return `${notification.creator.name || notification.creator.username} 关注了你`;
      default:
        return '新通知';
    }
  };

  const getNotificationBody = (notification: NotificationData): string => {
    switch (notification.type) {
      case 'LIKE':
        return notification.post?.content?.slice(0, 50) + (notification.post?.content && notification.post.content.length > 50 ? '...' : '') || '';
      case 'COMMENT':
        return notification.post?.content?.slice(0, 50) + (notification.post?.content && notification.post.content.length > 50 ? '...' : '') || '';
      case 'FOLLOW':
        return '点击查看详情';
      default:
        return '';
    }
  };

  // 用户登录时连接，登出时断开
  useEffect(() => {
    console.log('🔄 useNotificationWebSocket effect triggered, user:', user?.id);
    
    if (user?.id) {
      console.log('👤 User logged in, connecting WebSocket...');
      connect();
      // 获取初始未读数量
      refreshUnreadCount();
    } else {
      console.log('👤 User logged out, disconnecting WebSocket...');
      disconnect();
      setUnreadCount(0); // 用户登出时重置未读数量
    }

    return () => {
      console.log('🧹 useNotificationWebSocket cleanup');
      disconnect();
    };
  }, [user?.id]); // 只依赖用户ID变化

  // 心跳检测
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 25000); // 25秒发送一次心跳

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  return {
    isConnected,
    unreadCount,
    notifications,
    refreshUnreadCount,
    sendMessage,
    connect,
    disconnect,
  };
}
