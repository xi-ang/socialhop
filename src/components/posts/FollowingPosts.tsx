'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import PostCard from './PostCard';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, UsersIcon } from 'lucide-react';
import { Post, apiClient } from '@/lib/api-client';
import { usePosts } from '@/hooks/usePosts';

interface FollowingPostsProps {
  dbUserId: string | null;
}

export default function FollowingPosts({ dbUserId }: FollowingPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshCounter } = usePosts();

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // 获取关注用户的帖子
  const fetchPosts = useCallback(async (page = 1, reset = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const data = await apiClient.posts.getFollowing(page, pagination.limit) as any;
      
      if (data.success) {
        if (reset || page === 1) {
          setPosts(data.posts);
        } else {
          setPosts(prev => [...prev, ...data.posts]);
        }
        setPagination(data.pagination);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching following posts:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [pagination.limit]);

  // 初始加载
  useEffect(() => {
    fetchPosts(1, true);
  }, []);

  // 监听帖子刷新事件
  useEffect(() => {
    if (refreshCounter > 0) {
      fetchPosts(1, true);
    }
  }, [refreshCounter]);

  // 滚动加载更多
  useEffect(() => {
    if (inView && pagination.hasMore && !isLoadingMore && !isLoading) {
      fetchPosts(pagination.page + 1);
    }
  }, [inView, pagination.hasMore, pagination.page, isLoadingMore, isLoading]);

  if (isLoading) {
    return (
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
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <UsersIcon className="size-8 opacity-50" />
          </div>
          <h3 className="text-lg font-medium mb-2">加载失败</h3>
          <p className="text-sm mb-4">{error}</p>
          <button 
            onClick={() => fetchPosts(1, true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            重试
          </button>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <UsersIcon className="size-8 opacity-50" />
          </div>
          <h3 className="text-lg font-medium mb-2">暂无关注用户的帖子</h3>
          <p className="text-sm">关注一些用户后，他们的帖子会在这里显示</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} dbUserId={dbUserId} />
      ))}
      
      {pagination.hasMore && (
        <div ref={ref} className="flex justify-center py-4">
          {isLoadingMore && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>加载更多帖子...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
