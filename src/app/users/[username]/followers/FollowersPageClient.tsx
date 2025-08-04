"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, UsersIcon, UserPlusIcon } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import FollowButton from '@/components/users/FollowButton';

interface User {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
}

interface MainUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  _count: {
    followers: number;
    following: number;
  };
}

interface FollowersPageClientProps {
  user: MainUser;
  followers: User[];
  following: User[];
  initialTab: 'followers' | 'following';
}

function UserCard({ 
  user: userItem
}: { 
  user: User;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${userItem.id}`}>
              <Avatar className="w-12 h-12 cursor-pointer">
                <AvatarImage src={userItem.image || "/avatar.png"} alt={userItem.username} />
              </Avatar>
            </Link>
            <div className="flex-1">
              <Link href={`/profile/${userItem.id}`} className="block">
                <h3 className="font-semibold hover:underline">
                  {userItem.name || userItem.username}
                </h3>
                <p className="text-sm text-muted-foreground">@{userItem.username}</p>
              </Link>
              {userItem.bio && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{userItem.bio}</p>
              )}
            </div>
          </div>
          {/* 使用复用的 FollowButton 组件 */}
          <FollowButton userId={userItem.id} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function FollowersPageClient({
  user,
  followers,
  following,
  initialTab
}: FollowersPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'followers' | 'following');
    // 更新 URL 参数
    const newUrl = `/users/${user.username}/followers?tab=${value}`;
    router.push(newUrl);
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/profile/${user.id}`)}
              className="hover:bg-gray-100"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.image || "/avatar.png"} alt={user.username} />
              </Avatar>
              <div>
                <CardTitle className="text-xl">{user.name || user.username}</CardTitle>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="followers" className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4" />
            粉丝 ({user._count.followers})
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-2">
            <UserPlusIcon className="w-4 h-4" />
            关注 ({user._count.following})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="followers" className="mt-6">
          <div className="space-y-4">
            {followers.length > 0 ? (
              followers.map((follower) => (
                <UserCard 
                  key={follower.id} 
                  user={follower} 
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <UsersIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">还没有粉丝</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="following" className="mt-6">
          <div className="space-y-4">
            {following.length > 0 ? (
              following.map((followingUser) => (
                <UserCard 
                  key={followingUser.id} 
                  user={followingUser} 
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <UserPlusIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">还没有关注任何人</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
