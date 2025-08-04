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

  // 在服务端渲染时，不使用 PersistGate
  if (!isClient) {
    return (
      <Provider store={store}>
        <AuthChecker>
          {children}
        </AuthChecker>
      </Provider>
    );
  }

  // 在客户端，使用完整的持久化功能
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg">正在加载...</div>
          </div>
        } 
        persistor={persistor}
      >
        <AuthChecker>
          {children}
        </AuthChecker>
      </PersistGate>
    </Provider>
  );
}
