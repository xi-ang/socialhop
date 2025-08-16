'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !user) {
        router.push('/login');
      } else if (user.id) {
        router.push(`/profile/${user.id}`);
      }
    }
  }, [user, isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!user?.username) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">完善您的资料</h1>
          <p className="text-muted-foreground mb-4">
            请先设置您的用户名以访问您的个人资料页面。
          </p>
          <a href="/settings" className="text-primary hover:underline">
            前往设置
          </a>
        </div>
      </div>
    );
  }

  return null;
}
