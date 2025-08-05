'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeartIcon, MessageCircleIcon, UserPlusIcon, CheckIcon, AtSignIcon } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import PageControls from '@/components/common/PageControls';

// 定义通知类型，与 Redux slice 和 API 保持一致
interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION';
  read: boolean;
  createdAt: string;
  userId: string;
  creatorId: string;
  creator: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
  postId?: string;
  post?: {
    id: string;
    content: string | null;
    image: string | null;
  };
}

const getNotificationIcon = (type: string) => {
  switch (type as string) {
    case 'LIKE':
      return <HeartIcon className="size-4 text-red-500" />;
    case 'COMMENT':
      return <MessageCircleIcon className="size-4 text-blue-500" />;
    case 'FOLLOW':
      return <UserPlusIcon className="size-4 text-green-500" />;
    case 'MENTION':
      return <AtSignIcon className="size-4 text-purple-500" />;
    default:
      return null;
  }
};

const getNotificationText = (notification: Notification) => {
  const creatorName = notification.creator?.name || '用户';
  
  switch (notification.type as string) {
    case 'LIKE':
      return `${creatorName} 点赞了你的帖子`;
    case 'COMMENT':
      return `${creatorName} 评论了你的帖子`;
    case 'FOLLOW':
      return `${creatorName} 关注了你`;
    case 'MENTION':
      return `${creatorName} 在帖子中@了你`;
    default:
      return '收到了一条通知';
  }
};

const getNotificationLink = (notification: Notification) => {
  const type = notification.type as string;
  if (type === 'LIKE' && notification.post?.id) {
    return `/post/${notification.post.id}?tab=likes`;
  }
  if (type === 'COMMENT' && notification.post?.id) {
    return `/post/${notification.post.id}?tab=comments`;
  }
  if (type === 'FOLLOW' && notification.creator?.id) {
    return `/profile/${notification.creator.id}`;
  }
  if (type === 'MENTION' && notification.post?.id) {
    return `/post/${notification.post.id}`;
  }
  return '#';
};

export default function ReduxNotificationsPage() {
  const router = useRouter();
  
  // 🎯 完全使用 Redux 状态管理
  const { 
    notifications, 
    unreadCount, 
    loading, 
    loadNotifications, 
    markAsRead,
    markAllAsRead
  } = useNotifications();

  useEffect(() => {
    // 页面加载时刷新通知数据
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // 如果是未读通知，标记为已读
      if (!notification.read) {
        console.log('📖 Marking notification as read:', notification.id);
        const success = await markAsRead(notification.id);
        if (!success) {
          toast.error('标记已读失败');
          return;
        }
      }

      // 跳转到对应页面
      const link = getNotificationLink(notification);
      if (link !== '#') {
        router.push(link);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error('处理通知失败');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) {
        toast('没有未读通知');
        return;
      }

      console.log('📖 Marking all notifications as read...');
      
      // 使用 Redux action
      await markAllAsRead();
      
      toast.success(`已标记 ${unreadNotifications.length} 条通知为已读`);
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('标记通知失败');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* 页面控制按钮 */}
      <PageControls onRefresh={loadNotifications} />
      {/* <PageControls onRefresh={() => window.location.reload()} /> */}

      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold">通知</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">
              {unreadCount} 条未读
            </Badge>
          )}
        </div>
        
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2"
          >
            <CheckIcon className="size-4" />
            <span>全部已读</span>
          </Button>
        )}
      </div>

      {/* 通知列表 */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <HeartIcon className="size-8 opacity-50" />
            </div>
            <h3 className="text-lg font-medium mb-2">暂无通知</h3>
            <p className="text-sm">当有人点赞或评论你的帖子时，你会在这里收到通知</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                !notification.read 
                  ? 'border-blue-200 bg-blue-50/50' 
                  : 'hover:bg-gray-50/50'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* 头像 */}
                  <Link 
                    href={`/profile/${notification.creator?.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Avatar className="size-10 flex-shrink-0">
                      <AvatarImage 
                        src={notification.creator?.image ?? '/avatar.png'} 
                        alt={notification.creator?.name || 'User'}
                      />
                    </Avatar>
                  </Link>

                  {/* 通知内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getNotificationIcon(notification.type)}
                          <span className="font-medium text-sm">
                            {getNotificationText(notification)}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        
                        {/* 帖子预览 */}
                        {notification.post && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 break-all overflow-hidden">
                                "{notification.post.content}"
                            </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {/* {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })} */}
                            {formatDistanceToNow(new Date(notification.createdAt))} ago
                          </span>
                          
                          {!notification.read && (
                            // <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <Badge variant="secondary" className="text-xs">
                              未读
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
