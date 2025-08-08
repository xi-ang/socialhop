"use client";

import { createComment, deletePost, getPosts, toggleLike } from "@/actions/post.action";
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { apiClient } from '@/lib/api-client';
import { useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { formatTimeAgo } from "@/lib/timeFormat";
import { DeleteAlertDialog } from "@/components/common/DeleteAlertDialog";
import { Button } from "@/components/ui/button";
import { HeartIcon, LogInIcon, MessageCircleIcon, SendIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import ImageGrid from "./ImageGrid";
import FollowButton from "@/components/users/FollowButton";
import MentionText from "@/components/common/MentionText";

type Posts = Awaited<ReturnType<typeof getPosts>>;
type Post = Posts[number];


function PostCard({ post, dbUserId }: { post: Post; dbUserId: string | null }) {
  const { user } = useAuth();
  const { refreshPosts } = usePosts();
  const router = useRouter();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLiked, setHasLiked] = useState(post.likes.some((like) => like.userId === dbUserId));
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

  const handleLike = async () => {
    if (isLiking) return;
    console.log('🔄 Real like button clicked for post:', post.id);
    try {
      setIsLiking(true);
      setHasLiked((prev) => !prev);
      setOptmisticLikes((prev) => prev + (hasLiked ? -1 : 1));

      console.log('📤 Calling like API...');
      const result = await apiClient.posts.toggleLike(post.id);
      console.log('✅ Like API response:', result);

    } catch (error) {
      console.error('❌ Like error:', error);
      setOptmisticLikes(post._count.likes);
      setHasLiked(post.likes.some((like) => like.userId === dbUserId));
      toast.error('点赞失败，请重试');
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    console.log('💬 Real comment button clicked for post:', post.id);
    try {
      setIsCommenting(true);
      
      console.log('📤 Calling comment API...');
      const data = await apiClient.posts.addComment(post.id, newComment) as any;
      console.log('✅ Comment API response:', data);
      
      if (data.success && user) {
        toast.success("评论发布成功");
        setNewComment("");
        
        // 本地更新评论列表而不是刷新页面
        const newCommentData = {
          id: data.comment.id,
          content: newComment,
          createdAt: new Date(),
          authorId: user.id,
          postId: post.id,
          author: {
            id: user.id,
            username: user.username || user.name || '用户',
            name: user.name,
            image: user.image
          }
        };
        
        setLocalComments(prev => [newCommentData, ...prev]);
        setLocalCommentCount(prev => prev + 1);
        
        // 同时触发帖子列表的刷新（但不刷新页面）
        refreshPosts();
      } else {
        throw new Error(data.error || 'Failed to add comment');
      }

    } catch (error) {
      console.error('❌ Comment error:', error);
      toast.error("发布评论失败");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      
      await apiClient.posts.delete(post.id);
      toast.success("Post deleted successfully");
      
      // 刷新帖子列表
      refreshPosts();

    } catch (error) {
      toast.error("Failed to delete post");
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
              <Avatar className="size-8 sm:w-10 sm:h-10">
                <AvatarImage src={post.author.image ?? "/avatar.png"} />
              </Avatar>
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
                {previewComments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="size-8 flex-shrink-0">
                      <AvatarImage src={comment.author.image ?? "/avatar.png"} />
                    </Avatar>
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
                  <Avatar className="size-8 flex-shrink-0">
                    <AvatarImage src={user?.image || "/avatar.png"} />
                  </Avatar>
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
                        onClick={handleAddComment}
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
