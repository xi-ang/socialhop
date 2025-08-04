"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

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

export function useNotificationWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000; // 3秒

  const connect = () => {
    // 如果没有用户或已经连接，则不进行连接
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocket connection skipped:', { 
        hasUser: !!user, 
        readyState: wsRef.current?.readyState 
      });
      return;
    }

    // 如果正在连接中，也不要重复连接
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('⚠️ WebSocket already connecting...');
      return;
    }

    try {
      console.log('🚀 Connecting to WebSocket server...');
      // 连接到 WebSocket 服务器
      const ws = new WebSocket('ws://localhost:8080');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔗 WebSocket connected');
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
        const response = await fetch('/api/notifications/unread-count');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUnreadCount(data.unreadCount);
          }
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
    if (user) {
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
