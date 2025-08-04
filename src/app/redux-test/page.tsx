'use client';

import { useAuth } from '@/hooks/useAuth';

export default function ReduxTestPage() {
  const { user, loading, error, isAuthenticated } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Redux 状态测试</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Loading:</strong> {loading ? 'true' : 'false'}
        </div>
        
        <div>
          <strong>IsAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}
        </div>
        
        <div>
          <strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}
        </div>
        
        <div>
          <strong>Error:</strong> {error || 'null'}
        </div>
      </div>
      
      {user && (
        <div className="mt-8 p-4 bg-green-100 rounded">
          <h2 className="text-lg font-semibold">用户已登录</h2>
          <p>用户名: {user.username}</p>
          <p>邮箱: {user.email}</p>
        </div>
      )}
      
      {!user && !loading && (
        <div className="mt-8 p-4 bg-yellow-100 rounded">
          <h2 className="text-lg font-semibold">用户未登录</h2>
          <p>请前往 <a href="/login" className="text-blue-500 underline">/login</a> 登录</p>
        </div>
      )}
    </div>
  );
}
