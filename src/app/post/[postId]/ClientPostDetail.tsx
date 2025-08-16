'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import PostDetailClient from './PostDetailClient';
import { Card, CardContent } from '@/components/ui/card';

interface ClientPostDetailProps {
  postId: string;
  defaultTab: string;
}

// 骨架屏组件
function PostSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* 用户信息骨架 */}
            <div className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/6 animate-pulse"></div>
              </div>
            </div>
            
            {/* 帖子内容骨架 */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
            
            {/* 图片骨架 */}
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            
            {/* 操作按钮骨架 */}
            <div className="flex space-x-4 pt-4">
              <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClientPostDetail({ postId, defaultTab }: ClientPostDetailProps) {
  const [post, setPost] = useState<any>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await apiClient.posts.getById(postId) as any;
        setPost(data.post);
        setDbUserId(data.dbUserId);
      } catch (error) {
        console.error('Error fetching post:', error);
        if (error instanceof Error && error.message.includes('帖子不存在')) {
          setError('not-found');
        } else {
          setError(error instanceof Error ? error.message : '获取帖子失败');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchPost();
  }, [postId]);

  if (isLoading) {
    return <PostSkeleton />;
  }

  if (error === 'not-found' || !post) {
    notFound();
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              重试
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PostDetailClient 
      post={post} 
      dbUserId={dbUserId} 
      defaultTab={defaultTab}
    />
  );
}
