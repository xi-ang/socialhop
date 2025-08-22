"use client";

import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { apiClient } from '@/lib/api-client';
import { useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LazyAvatar, LazyAvatarImage, LazyAvatarFallback } from "@/components/ui/lazy-avatar";

import { formatTimeAgo } from "@/lib/timeFormat";
import { DeleteAlertDialog } from "@/components/common/DeleteAlertDialog";
import { Button } from "@/components/ui/button";
import { HeartIcon, LogInIcon, MessageCircleIcon, SendIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import ImageGrid from "./ImageGrid";
import FollowButton from "@/components/users/FollowButton";
import MentionText from "@/components/common/MentionText";

// 使用 any 类型简化处理
type Post = any;

function PostCard({ post, dbUserId }: { post: Post; dbUserId: string | null }) {
  const { user } = useAuth();
  const { refreshPosts } = usePosts();
  const router = useRouter();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLiked, setHasLiked] = useState(post.likes.some((like: any) => like.userId === dbUserId));
  const [optimisticLikes, setOptmisticLikes] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);
  const [localComments, setLocalComments] = useState(post.comments);
  const [localCommentCount, setLocalCommentCount] = useState(post._count.comments);

  // 限制显示的评论数量
  const PREVIEW_COMMENTS_COUNT = 3;
  const previewComments = localComments.slice(0, PREVIEW_COMMENTS_COUNT);
  const hasMoreComments = localComments.length > PREVIEW_COMMENTS_COUNT;

  const handlePostClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮、链接或其他交互元素，不跳转
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('textarea') ||
      target.closest('[role="button"]')
    ) {
      return;
    }
    
    router.push(`/post/${post.id}`);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('请先登录');
      return;
    }

    // 乐观更新
    setHasLiked((prev: any) => !prev);
    setOptmisticLikes((prev: any) => prev + (hasLiked ? -1 : 1));

    try {
      const result = await apiClient.posts.toggleLike(post.id) as any;
      if (result.success) {
        // 更新本地状态
        setHasLiked(post.likes.some((like: any) => like.userId === dbUserId));
        setOptmisticLikes(result.post._count.likes);
      }
    } catch (error) {
      // 回滚乐观更新
      setHasLiked((prev: any) => !prev);
      setOptmisticLikes((prev: any) => prev + (hasLiked ? 1 : -1));
      console.error('❌ Like error:', error);
      toast.error('点赞失败，请重试');
    }
  };

  const handleComment = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (!newComment.trim()) {
      toast.error('请输入评论内容');
      return;
    }

    try {
      const data = await apiClient.posts.addComment(post.id, newComment) as any;
      if (data.success && user) {
        toast.success("评论发布成功");
        setNewComment("");
        
        // 本地更新评论列表
        const newCommentData = {
          id: data.comment.id,
          content: newComment,
          createdAt: new Date().toISOString(),
          author: {
            id: user.id,
            name: user.name,
            username: user.username,
            image: user.image
          }
        };
        setLocalComments((prev: any) => [newCommentData, ...prev]);
        // 优先使用服务端返回的最新评论计数，否则本地乐观更新
        setLocalCommentCount(data.post?._count?.comments ?? ((prev: any) => prev + 1));
        
        // 同时触发帖子列表的刷新（但不刷新页面）
        refreshPosts();
      }
    } catch (error) {
      console.error('❌ Comment error:', error);
      toast.error("发布评论失败");
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      
      await apiClient.posts.delete(post.id);
      toast.success("帖子删除成功");
      
      // 刷新帖子列表
      refreshPosts();

    } catch (error) {
      toast.error("删除帖子失败");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden cursor-pointer hover:bg-gray-50/50 transition-colors">
      <CardContent className="p-4 sm:p-6" onClick={handlePostClick}>
        <div className="space-y-4">
          <div className="flex space-x-3 sm:space-x-4">
            <Link href={`/profile/${post.author.id}`}>
              <LazyAvatar className="size-8 sm:w-10 sm:h-10">
                <LazyAvatarImage src={
                  // 如果帖子作者是当前用户，使用全局用户状态的头像，否则使用帖子中的头像
                  user?.id === post.author.id ? (user?.image ?? "/avatar.png") : (post.author.image ?? "/avatar.png")
                } alt={post.author.name} />
                <LazyAvatarFallback>{post.author.name?.charAt(0)?.toUpperCase() || '?'}</LazyAvatarFallback>
              </LazyAvatar>
            </Link>

            {/* POST HEADER & TEXT CONTENT */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 truncate">
                  <Link
                    href={`/profile/${post.author.id}`}
                    className="font-semibold truncate"
                  >
                    {post.author.name}
                  </Link>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Link href={`/profile/${post.author.id}`}>@{post.author.username}</Link>
                    <span>•</span>
                    <span>{formatTimeAgo(new Date(post.createdAt))}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* 关注按钮 */}
                  <FollowButton userId={post.author.id} />
                  {/* Check if current user is the post author */}
                  {dbUserId === post.author.id && (
                    <DeleteAlertDialog isDeleting={isDeleting} onDelete={handleDeletePost} />
                  )}
                </div>
              </div>
              <MentionText 
                content={post.content || ''} 
                className="mt-2 text-sm text-foreground break-words"
              />
            </div>
          </div>

          {/* POST IMAGES */}
          <ImageGrid 
            images={(post as any).images && (post as any).images.length > 0 ? (post as any).images : (post.image ? [post.image] : [])} 
          />

          {/* LIKE & COMMENT BUTTONS */}
          <div className="flex items-center pt-2 space-x-4">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className={`text-muted-foreground gap-2 ${
                  hasLiked ? "text-red-500 hover:text-red-600" : "hover:text-red-500"
                }`}
                onClick={handleLike}
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
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                  <HeartIcon className="size-5" />
                  <span>{optimisticLikes}</span>
                </Button>
              </Link>
            )}

            {/* 点赞详情链接 */}
            {/* {optimisticLikes > 0 && (
              <Link 
                href={`/post/${post.id}?tab=likes`}
                className="text-sm text-muted-foreground hover:text-blue-500 hover:underline"
              >
                查看点赞
              </Link>
            )} */}

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-2 hover:text-blue-500"
              onClick={() => setShowComments((prev) => !prev)}
            >
              <MessageCircleIcon
                className={`size-5 ${showComments ? "fill-blue-500 text-blue-500" : ""}`}
              />
              <span>{localCommentCount}</span>
            </Button>
          </div>

          {/* COMMENTS SECTION */}
          {showComments && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-4">
                {/* DISPLAY PREVIEW COMMENTS */}
                {previewComments.map((comment: any) => (
                  <div key={comment.id} className="flex space-x-3">
                    <LazyAvatar className="size-8 flex-shrink-0">
                      <LazyAvatarImage src={
                        // 如果评论作者是当前用户，使用全局用户状态的头像，否则使用评论中的头像
                        user?.id === comment.author.id ? (user?.image ?? "/avatar.png") : (comment.author.image ?? "/avatar.png")
                      } alt={comment.author.name} />
                      <LazyAvatarFallback>{comment.author.name?.charAt(0)?.toUpperCase() || '?'}</LazyAvatarFallback>
                    </LazyAvatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium text-sm">{comment.author.name}</span>
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
                        className="text-sm break-words"
                      />
                    </div>
                  </div>
                ))}

                {/* 查看更多评论链接 */}
                {hasMoreComments && (
                  <div className="text-center pt-2">
                    <Link 
                      href={`/post/${post.id}?tab=comments`}
                      className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                    >
                      查看全部 {localCommentCount} 条评论...
                    </Link>
                  </div>
                )}
              </div>

              {user ? (
                <div className="flex space-x-3">
                  <LazyAvatar className="size-8 flex-shrink-0">
                    <LazyAvatarImage src={user?.image || "/avatar.png"} alt={user?.name || "用户"} />
                    <LazyAvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || '?'}</LazyAvatarFallback>
                  </LazyAvatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="写下你的评论..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none"
                      maxLength={50}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-muted-foreground">
                        {newComment.length}/50
                      </div>
                      <Button
                        size="sm"
                        onClick={handleComment}
                        className="flex items-center gap-2"
                        disabled={!newComment.trim() || isCommenting}
                      >
                        {isCommenting ? (
                          "发布中..."
                        ) : (
                          <>
                            <SendIcon className="size-4" />
                            评论
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                  <Link href="/login">
                    <Button variant="outline" className="gap-2">
                      <LogInIcon className="size-4" />
                      登录后评论
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
export default PostCard;
