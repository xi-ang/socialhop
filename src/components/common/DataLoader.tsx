'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';

/**
 * 全局数据加载器组件
 * 负责在用户登录时初始化应用数据和WebSocket连接
 */
export function DataLoader() {
  const { user, isAuthenticated } = useAuth();
  const { loadNotifications, addNotification, setUnreadCount } = useNotifications();
  
  console.log('🔄 DataLoader rendered, user:', user?.id, 'authenticated:', isAuthenticated);
  
  // 🎯 集成 WebSocket 实时未读数量通知
  const { 
    isConnected, 
    unreadCount, 
    notifications: wsNotifications 
  } = useNotificationWebSocket();

  console.log('📡 WebSocket状态 - 连接:', isConnected, '未读:', unreadCount, '通知数:', wsNotifications.length);

  useEffect(() => {
    if (isAuthenticated && user) {
      // 用户登录时加载通知数据
      loadNotifications();
    }
  }, [isAuthenticated, user, loadNotifications]);

  // 🎯 处理 WebSocket 接收到的新通知
  useEffect(() => {
    if (wsNotifications.length > 0) {
      const latestNotification = wsNotifications[0];
      console.log('🔔 DataLoader: 收到新的 WebSocket 通知', latestNotification);
      // 将新通知添加到 Redux store
      addNotification(latestNotification);
      console.log('✅ DataLoader: 通知已添加到 Redux store');
    }
  }, [wsNotifications, addNotification]);

  // 🎯 同步 WebSocket 未读数量到 Redux
  useEffect(() => {
    console.log('📊 同步未读数量: WebSocket =', unreadCount);
    if (unreadCount >= 0) { // 只有当未读数量是有效值时才同步
      console.log('🔄 调用 setUnreadCount，更新 Redux 为:', unreadCount);
      setUnreadCount(unreadCount);
    }
  }, [unreadCount, setUnreadCount]);

  // // 🎯 监控 Redux 中的未读数量变化
  // const { unreadCount: reduxUnreadCount } = useNotifications();
  // useEffect(() => {
  //   console.log('📈 Redux 未读数量变化:', reduxUnreadCount);
  // }, [reduxUnreadCount]);

  return null; // 这是一个无UI组件
}
