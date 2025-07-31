"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LinkIcon, MapPinIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

interface UserStats {
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

function Sidebar() {
  const { user, loading } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // 获取用户统计数据
  const fetchUserStats = async () => {
    if (!user) return;
    
    setStatsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/stats`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // 用户登录后获取统计数据
  useEffect(() => {
    if (user && !loading) {
      fetchUserStats();
    }
  }, [user, loading]);

  // 每30秒刷新一次数据（可根据需要调整）
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(fetchUserStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="sticky top-20">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 border-2 rounded-full bg-muted animate-pulse"></div>
              <div className="mt-4 space-y-1">
                <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return <UnAuthenticatedSidebar />;

  return (
    <div className="sticky top-20">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Link
              href={`/profile/${user.id}`}
              className="flex flex-col items-center justify-center"
            >
              <Avatar className="w-20 h-20 border-2 ">
                <AvatarImage src={user.image || "/avatar.png"} />
              </Avatar>

              <div className="mt-4 space-y-1">
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </Link>

            {/* TODO: 添加user.bio字段 */}
            {/* {user.bio && <p className="mt-3 text-sm text-muted-foreground">{user.bio}</p>} */}

            <div className="w-full">
              {/* 分割线 */}
              <Separator className="my-4" />
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">
                    {statsLoading ? '...' : userStats.followingCount}
                  </p>
                  <p className="text-xs text-muted-foreground">关注</p>
                </div>
                <Separator orientation="vertical" />
                <div>
                  <p className="font-medium">
                    {statsLoading ? '...' : userStats.followersCount}
                  </p>
                  <p className="text-xs text-muted-foreground">粉丝</p>
                </div>
              </div>
              <Separator className="my-4" />
            </div>

            <div className="w-full space-y-2 text-sm">
              {user.location && (
                <div className="flex items-center text-muted-foreground">
                  <MapPinIcon className="w-4 h-4 mr-2" />
                  {user.location}
                </div>
              )}
              {user.website && (
                <div className="flex items-center text-muted-foreground">
                  <LinkIcon className="w-4 h-4 mr-2 shrink-0" />
                  <a 
                    href={user.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline truncate"
                  >
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {!user.location && !user.website && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  个人资料完善度: {user.bio ? '60%' : '40%'}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Sidebar;

const UnAuthenticatedSidebar = () => (
  <div className="sticky top-20">
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl font-semibold">欢迎回来!</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground mb-4">
          登录以访问您的个人资料并与他人联系。
        </p>
        <Button className="w-full" variant="outline" asChild>
          <Link href="/login">登录</Link>
        </Button>
        <Button className="w-full mt-2" variant="default" asChild>
          <Link href="/register">注册</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);
