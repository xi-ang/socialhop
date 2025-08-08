"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';

interface FollowButtonProps {
  userId: string;
  className?: string;
}

interface FollowStatus {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

function FollowButton({ userId, className }: FollowButtonProps) {
  const { user } = useAuth();
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 获取关注状态 - 移到条件判断之前
  useEffect(() => {
    // 只有当用户存在且不是自己时才获取状态
    if (!user || user.id === userId) {
      return;
    }

    const fetchFollowStatus = async () => {
      try {
        const data = await apiClient.users.getFollowStatus(userId) as any;
        
        if (data.success) {
          setFollowStatus(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch follow status:', error);
      }
    };

    fetchFollowStatus();
  }, [userId, user]);

  // 如果是自己，不显示关注按钮
  if (!user || user.id === userId) {
    return null;
  }

  const handleFollow = async () => {
    if (!followStatus || isLoading) return;

    setIsLoading(true);
    try {
      const data = await apiClient.users.toggleFollow(userId) as any;
      
      if (data.success) {
        setFollowStatus(prev => prev ? {
          ...prev,
          isFollowing: !prev.isFollowing,
          followersCount: prev.isFollowing 
            ? prev.followersCount - 1 
            : prev.followersCount + 1,
        } : null);
        
        toast.success(followStatus.isFollowing ? "取消关注成功" : "关注成功");
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch (error) {
      toast.error("操作失败");
      console.error('Follow operation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!followStatus) {
    return (
      <Button variant="outline" disabled className={`w-20 ${className}`}>
        <Loader2Icon className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant={followStatus.isFollowing ? "default" : "secondary"}
      onClick={handleFollow}
      disabled={isLoading}
      className={`w-20 ${className}`}
    >
      {isLoading ? (
        <Loader2Icon className="w-4 h-4 animate-spin" />
      ) : followStatus.isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 mr-1" />
          已关注
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          关注
        </>
      )}
    </Button>
  );
}
export default FollowButton;
