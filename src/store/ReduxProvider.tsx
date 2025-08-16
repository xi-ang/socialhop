'use client';

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './index';
import { useAppDispatch } from './hooks';
import { checkAuth } from './slices/authSlice';

// 认证检查组件
function AuthChecker({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 应用启动时检查认证状态
    dispatch(checkAuth());
  }, [dispatch]);

  return <>{children}</>;
}

// Redux Provider包装器
export function ReduxProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 在服务端渲染和初次客户端渲染时，立即显示内容而不等待持久化
  if (!isClient) {
    return (
      <Provider store={store}>
        <AuthChecker>
          {children}
        </AuthChecker>
      </Provider>
    );
  }

  // 客户端渲染：同时进行持久化恢复和内容渲染
  // (PersistGate 的主要作用是在状态持久化（Rehydration）完成之前，阻止应用的 UI 渲染。)
  return (
    <Provider store={store}>
      <PersistGate 
        loading={null} // 不显示加载屏，让页面立即渲染
        persistor={persistor}
      >
        <AuthChecker>
          {children}
        </AuthChecker>
      </PersistGate>
    </Provider>
  );
}
