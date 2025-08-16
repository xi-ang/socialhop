'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { apiClient, User } from '@/lib/api-client';
import ProfilePageClient from './ProfilePageClient';
import { Card, CardContent } from '@/components/ui/card';

// 定义个人资料数据类型
interface ProfileData {
  posts: unknown[];
  likedPosts: unknown[];
  commentedPosts: unknown[];
  isCurrentUserFollowing: boolean;
}

// 骨架屏组件
function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* 用户信息骨架 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              <div className="flex space-x-4 pt-2">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 帖子骨架 */}
      <Card>
        <CardContent className="p-0">
          {/* Tab 骨架 */}
          <div className="border-b p-1">
            <div className="grid grid-cols-3 gap-1">
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* 帖子列表骨架 */}
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePageClientWrapper() {
  const params = useParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setIsLoading(true);
        setError(null);

        // 并行获取用户信息和个人资料数据
        const [userResponse, profileResponse] = await Promise.all([
          apiClient.users.getById(userId),
          apiClient.profile.getProfile(userId)
        ]);

        setUser((userResponse as { user: User }).user);
        setProfileData(profileResponse as ProfileData);

      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error instanceof Error ? error.message : '加载失败');
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  // 动态设置页面标题
  useEffect(() => {
    if (user) {
      document.title = `${user.name ?? user.username} | Social`;
      
      // 设置 meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', user.bio || `Check out ${user.username}'s profile.`);
      }
    }
  }, [user]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !user) {
    notFound();
  }

  if (!profileData) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">加载个人资料数据失败</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProfilePageClient
      user={user}
      posts={profileData.posts || []}
      likedPosts={profileData.likedPosts || []}
      commentedPosts={profileData.commentedPosts || []}
      isCurrentUserFollowing={profileData.isCurrentUserFollowing}
    />
  );
}
