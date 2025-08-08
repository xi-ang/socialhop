'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { formatTimeAgo } from '@/lib/timeFormat';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeartIcon, MessageCircleIcon, SendIcon, ArrowLeftIcon, LogInIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ImageGrid from '@/components/posts/ImageGrid';
import MentionText from '@/components/common/MentionText';

type PostDetailProps = {
  post: {
    id: string;
    content: string;
    image: string | null;
    createdAt: Date;
    author: {
      id: string;
      username: string;
      name: string;
      image: string | null;
    };
    likes: Array<{
      userId: string;
      user: {
        id: string;
        username: string;
        name: string;
        image: string | null;
      };
    }>;
    comments: Array<{
      id: string;
      content: string;
      createdAt: Date;
      author: {
        id: string;
        username: string;
        name: string;
        image: string | null;
      };
    }>;
    _count: {
      likes: number;
      comments: number;
    };
  };
  dbUserId: string | null;
  defaultTab: string;
};

export default function PostDetailClient({ post, dbUserId, defaultTab }: PostDetailProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(
    post.likes.some((like) => like.userId === dbUserId)
  );
  const [optimisticLikes, setOptimisticLikes] = useState(post._count.likes);
  const [localComments, setLocalComments] = useState(post.comments);
  const [localCommentCount, setLocalCommentCount] = useState(post._count.comments);

  const handleLike = async () => {
    if (isLiking) return;
    console.log('🔄 Detail page like clicked for post:', post.id);
    try {
      setIsLiking(true);
      setHasLiked((prev) => !prev);
      setOptimisticLikes((prev) => prev + (hasLiked ? -1 : 1));

      const result = await apiClient.posts.toggleLike(post.id);
      console.log('✅ Detail page like API response:', result);

    } catch (error) {
      console.error('❌ Detail page like error:', error);
      setOptimisticLikes(post._count.likes);
      setHasLiked(post.likes.some((like) => like.userId === dbUserId));
      toast.error('点赞失败');
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    console.log('💬 Detail page comment clicked for post:', post.id);
    try {
      setIsCommenting(true);
      
      const data = await apiClient.posts.addComment(post.id, newComment) as any;
      console.log('✅ Detail page comment API response:', data);
      
      if (data.success && user) {
        toast.success('评论发布成功');
        setNewComment('');
        
        // 本地更新评论列表而不是刷新页面
        const newCommentData = {
          id: data.comment.id,
          content: newComment,
          createdAt: new Date(),
          author: {
            id: user.id,
            username: user.username || user.name || '用户',
            name: user.name || '用户',
            image: user.image
          }
        };
        
        setLocalComments(prev => [newCommentData, ...prev]);
        setLocalCommentCount(prev => prev + 1);
      } else {
        throw new Error(data.error || 'Failed to add comment');
      }

    } catch (error) {
      console.error('❌ Detail page comment error:', error);
      toast.error('发布评论失败');
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()}
          className="flex items-center space-x-2"
        >
          <ArrowLeftIcon className="size-4" />
          <span>返回</span>
        </Button>
      </div>

      {/* 帖子主体 */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* 作者信息 */}
            <div className="flex space-x-4">
              <Link href={`/profile/${post.author.id}`}>
                <Avatar className="w-12 h-12">
                  <AvatarImage src={post.author.image ?? '/avatar.png'} />
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/profile/${post.author.id}`}
                    className="font-semibold hover:underline"
                  >
                    {post.author.name}
                  </Link>
                  <span className="text-muted-foreground">@{post.author.username}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {formatTimeAgo(new Date(post.createdAt))}
                  </span>
                </div>
              </div>
            </div>

            {/* 帖子内容 */}
            <div className="space-y-4">
              <MentionText 
                content={post.content} 
                className="text-lg break-words"
              />
              
              {/* 图片 */}
              <ImageGrid 
                images={(post as any).images && (post as any).images.length > 0 
                  ? (post as any).images 
                  : (post.image ? [post.image] : [])
                } 
              />
            </div>

            {/* 互动按钮 */}
            <div className="flex items-center pt-4 space-x-6 border-t">
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center space-x-2 ${
                    hasLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'
                  }`}
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  {hasLiked ? (
                    <HeartIcon className="size-5 fill-current" />
                  ) : (
                    <HeartIcon className="size-5" />
                  )}
                  <span>{optimisticLikes}</span>
                </Button>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <HeartIcon className="size-5" />
                    <span>{optimisticLikes}</span>
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:text-blue-500"
                onClick={() => setActiveTab('comments')}
              >
                <MessageCircleIcon className="size-5" />
                <span>{localCommentCount}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详情标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comments">
            评论 ({post._count.comments})
          </TabsTrigger>
          <TabsTrigger value="likes">
            点赞 ({post._count.likes})
          </TabsTrigger>
        </TabsList>

        {/* 评论标签页 */}
        <TabsContent value="comments" className="space-y-4">
          {/* 添加评论 */}
          {user ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <Avatar className="size-8 flex-shrink-0">
                    <AvatarImage src={user?.image || '/avatar.png'} />
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="写下你的评论..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px] resize-none"
                      maxLength={280}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-xs text-muted-foreground">
                        {newComment.length}/280
                      </div>
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isCommenting}
                        className="flex items-center space-x-2"
                      >
                        {isCommenting ? (
                          '发布中...'
                        ) : (
                          <>
                            <SendIcon className="size-4" />
                            <span>评论</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                <Link href="/login">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <LogInIcon className="size-4" />
                    <span>登录后评论</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* 评论列表 */}
          <div className="space-y-4">
            {localComments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  暂无评论，快来抢沙发！
                </CardContent>
              </Card>
            ) : (
              localComments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <Link href={`/profile/${comment.author.id}`}>
                        <Avatar className="size-8 flex-shrink-0">
                          <AvatarImage src={comment.author.image ?? '/avatar.png'} />
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Link
                            href={`/profile/${comment.author.id}`}
                            className="font-medium hover:underline"
                          >
                            {comment.author.name}
                          </Link>
                          <span className="text-sm text-muted-foreground">
                            @{comment.author.username}
                          </span>
                          <span className="text-sm text-muted-foreground">·</span>
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(new Date(comment.createdAt))}
                          </span>
                        </div>
                        <MentionText 
                          content={comment.content} 
                          className="break-words"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* 点赞标签页 */}
        <TabsContent value="likes" className="space-y-4">
          <div className="space-y-4">
            {post.likes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  暂无点赞
                </CardContent>
              </Card>
            ) : (
              post.likes.map((like) => (
                <Card key={like.userId}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Link href={`/profile/${like.user.id}`}>
                        <Avatar className="size-10">
                          <AvatarImage src={like.user.image ?? '/avatar.png'} />
                        </Avatar>
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/profile/${like.user.id}`}
                            className="font-medium hover:underline"
                          >
                            {like.user.name}
                          </Link>
                          <span className="text-muted-foreground">
                            @{like.user.username}
                          </span>
                        </div>
                      </div>
                      <HeartIcon className="size-5 text-red-500 fill-current" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
