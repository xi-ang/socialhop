"use client";

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { TokenManager } from '@/lib/token-manager';

/**
 * 认证初始化组件
 * 在应用启动时检查并恢复认证状态
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuth();

  useEffect(() => {
    // 检查是否有有效的 token，如果有则初始化认证状态
    if (TokenManager.hasToken() && !TokenManager.isTokenExpired()) {
      initialize();
    }
  }, [initialize]);

  return <>{children}</>;
}
