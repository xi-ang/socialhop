'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

/**
 * 全局数据加载器组件
 * 负责在用户登录时初始化应用数据
 */
export function DataLoader() {
  const { user, isAuthenticated } = useAuth();
  const { loadNotifications } = useNotifications();

  useEffect(() => {
    if (isAuthenticated && user) {
      // 用户登录时加载通知数据
      loadNotifications();
    }
  }, [isAuthenticated, user, loadNotifications]);

  return null; // 这是一个无UI组件
}
