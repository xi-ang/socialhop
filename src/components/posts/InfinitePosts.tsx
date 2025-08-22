'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { apiClient, Post } from '@/lib/api-client';
import PostCard from '@/components/posts/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2Icon } from 'lucide-react';

type InfinitePostsProps = {
  initialPosts: Post[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
  dbUserId: string | null;
};

export default function InfinitePosts({ 
  initialPosts, 
  initialPagination, 
  dbUserId 
}: InfinitePostsProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshCounter } = usePosts();

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  const loadMorePosts = useCallback(async () => {
    if (isLoading || !pagination.hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.posts.getAll(pagination.page + 1, pagination.limit) as any;
      
      if (result.success) {
        setPosts(prev => [...prev, ...result.data.posts]);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.error || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
              setError(error instanceof Error ? error.message : '加载更多帖子失败');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, pagination]);

  const refreshPosts = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const result = await apiClient.posts.getAll(1, 10) as any;
      
      if (result.success) {
        setPosts(result.data.posts);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.error || 'Failed to refresh posts');
      }
    } catch (error) {
      console.error('Error refreshing posts:', error);
              setError(error instanceof Error ? error.message : '刷新帖子失败');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 监听帖子刷新事件
  useEffect(() => {
    if (refreshCounter > 0) {
      refreshPosts();
    }
  }, [refreshCounter, refreshPosts]);

  useEffect(() => {
    if (inView) {
      loadMorePosts();
    }
  }, [inView, loadMorePosts]);

  return (
    <div className="space-y-6 pb-6">
      {/* 刷新中的骨架屏 */}
      {isRefreshing && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* 帖子列表 */}
      {!isRefreshing && posts.map((post) => (
        <PostCard key={post.id} post={post as any} dbUserId={dbUserId} />
      ))}

      {/* 加载更多指示器 */}
      {pagination.hasMore && (
        <div ref={ref} className="flex justify-center py-8">
          {isLoading ? (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2Icon className="size-5 animate-spin" />
              <span>加载中...</span>
            </div>
          ) : error ? (
            <div className="text-center space-y-2">
              <p className="text-red-500">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadMorePosts}
              >
                重试
              </Button>
            </div>
          ) : (
            <div className="text-muted-foreground">
              滚动加载更多...
            </div>
          )}
        </div>
      )}

      {/* 已加载完所有帖子 */}
      {!pagination.hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>已加载全部 {pagination.totalCount} 篇帖子</p>
        </div>
      )}

      {/* 无帖子状态 */}
      {posts.length === 0 && !isRefreshing && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-4">还没有帖子</p>
          <p>快来发布第一篇帖子吧！</p>
        </div>
      )}

      {/* 主页控制按钮 */}
      {/* <PageControls onRefresh={refreshPosts} isRefreshing={isRefreshing} /> */}
    </div>
  );
}
