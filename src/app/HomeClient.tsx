'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import CreatePost from '@/components/posts/CreatePost';
import InfinitePosts from '@/components/posts/InfinitePosts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, UsersIcon } from 'lucide-react';
import { Post } from '@/lib/api-client';
import PageControls from '@/components/common/PageControls';
import FollowingPosts from '@/components/posts/FollowingPosts';

type HomeClientProps = {
  initialPosts: Post[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
};

// 骨架屏组件
function HomeSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-10">
        {/* 页面控制按钮骨架 */}
        <div className="mb-4 flex justify-end">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* 创建帖子骨架 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主要内容区域骨架 */}
        <Card className="mb-6">
          <CardContent className="p-0">
            {/* Tab列表骨架 */}
            <div className="border-b p-1">
              <div className="grid grid-cols-2 gap-1">
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* 帖子列表骨架 */}
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        <div className="flex space-x-4 pt-2">
                          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function HomeClient({ 
  initialPosts, 
  initialPagination 
}: HomeClientProps) {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('square');
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    // 页面加载完成后移除骨架屏
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 显示骨架屏的条件：页面正在加载或用户认证正在加载
  if (isPageLoading || loading) {
    return <HomeSkeleton />;
  }

  const handleRefresh = () => {
    // setIsPageLoading(true);
    window.location.reload();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-10">
        {/* 页面控制按钮 */}
        <PageControls onRefresh={handleRefresh} />
        
        {/* 创建帖子 */}
        {user && <CreatePost />}

        {/* 主要内容区域 */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/30">
                <TabsTrigger 
                  value="square" 
                  className="flex items-center gap-2 py-3 data-[state=active]:bg-background"
                >
                  <Globe className="w-4 h-4" />
                  广场
                </TabsTrigger>
                <TabsTrigger 
                  value="following" 
                  className="flex items-center gap-2 py-3 data-[state=active]:bg-background"
                  disabled={!user}
                >
                  <UsersIcon className="w-4 h-4" />
                  关注
                </TabsTrigger>
              </TabsList>

              {/* 广场帖子 */}
              <TabsContent value="square" className="mt-0 p-6">
                <InfinitePosts 
                  initialPosts={initialPosts}
                  initialPagination={initialPagination}
                  dbUserId={user?.id || null}
                />
              </TabsContent>

              {/* 关注用户的帖子 */}
              <TabsContent value="following" className="mt-0 p-6">
                <div className="space-y-6">
                  {user ? (
                    <FollowingPosts dbUserId={user?.id || null} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      请先登录以查看关注的帖子
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 右侧边栏 - 暂时隐藏 */}
      {/* <div className="hidden lg:block lg:col-span-4 sticky top-20">
        <WhoToFollow />
      </div> */}
    </div>
  );
}
