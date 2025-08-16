"use client";

import { useAuth } from '@/hooks/useAuth';
import { apiClient } from "@/lib/api-client";
import PostCard from "@/components/posts/PostCard";
import { LazyAvatar, LazyAvatarImage, LazyAvatarFallback } from "@/components/ui/lazy-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  CalendarIcon,
  EditIcon,
  FileTextIcon,
  HeartIcon,
  LinkIcon,
  MapPinIcon,
  MessageCircleIcon,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

// 使用简化的类型定义
type User = any;
type Posts = any[];

interface ProfilePageClientProps {
  user: NonNullable<User>;
  posts: Posts;
  likedPosts: Posts;
  commentedPosts: Posts;
  isCurrentUserFollowing: boolean;
}

function ProfilePageClient({
  isCurrentUserFollowing: initialIsFollowing,
  likedPosts,
  commentedPosts = [], // 添加默认值
  posts,
  user,
}: ProfilePageClientProps) {
  const { user: currentUser, updateUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 头像相关状态
  const [currentAvatar, setCurrentAvatar] = useState(user.image);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  const [editFormData, setEditFormData] = useState({
    username: user.username || "",
    name: user.name || "",
    bio: user.bio || "用户很懒，什么都没有留下~~~~",
    location: user.location || "地球村O_O",
    website: user.website || "www.example.com",
  });
  const [usernameError, setUsernameError] = useState("");

  const validateUsername = (username: string) => {
    if (!username) {
      setUsernameError("用户名不能为空");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError("用户名只能包含字母、数字和下划线");
      return false;
    }
    if (username.length < 3) {
      setUsernameError("用户名至少3个字符");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const handleUsernameChange = (value: string) => {
    setEditFormData(prev => ({ ...prev, username: value }));
    validateUsername(value);
  };

  const handleAvatarChange = async (newAvatarUrl: string) => {
    try {
      const result = await apiClient.profile.updateAvatar(newAvatarUrl) as any;
      if (result.success) {
        toast.success("头像更新成功！");
        // 立即更新头像显示，而不是刷新页面
        setCurrentAvatar(newAvatarUrl);
        // 也更新用户对象，以确保其他地方使用的头像也是最新的
        user.image = newAvatarUrl;
        
        // 最重要：更新全局Redux状态，确保侧边栏和其他组件的头像也同步更新
        if (currentUser && currentUser.id === user.id) {
          updateUser({ ...currentUser, image: newAvatarUrl });
        }
      } else {
        toast.error(result.error || "头像更新失败");
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("头像更新失败");
    }
  };

  // 直接处理头像上传的函数
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小 (4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error('图片大小不能超过 4MB');
      return;
    }

    try {
      setIsAvatarUploading(true);
      
      // 使用 FormData 上传文件
      const formData = new FormData();
      formData.append('file', file);

      // 使用 apiClient 上传文件，这会自动处理认证
      const result = await apiClient.upload.uploadFile(formData) as any;

      if (result.success && result.url) {
        await handleAvatarChange(result.url);
      } else {
        toast.error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('上传失败');
    } finally {
      setIsAvatarUploading(false);
      // 清除文件输入，允许重新选择相同文件
      event.target.value = '';
    }
  };

  // 触发文件选择的函数
  const triggerAvatarUpload = () => {
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    fileInput?.click();
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error("请登录后关注用户");
      return;
    }

    try {
      setIsFollowing((prev) => !prev);
      await apiClient.users.toggleFollow(user.id);
      toast.success(isFollowing ? "取消关注成功" : "关注成功");
    } catch (error) {
      setIsFollowing((prev) => !prev);
      console.error(error);
      toast.error("操作失败，请重试");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", editFormData.username);
      formData.append("name", editFormData.name);
      formData.append("bio", editFormData.bio);
      formData.append("location", editFormData.location);
      formData.append("website", editFormData.website);

      const result = await apiClient.profile.update(formData) as any;
      if (result.success) {
        toast.success("个人资料更新成功");
        setShowEditDialog(false);
        // Optionally refresh the page or update local state
        window.location.reload();
      } else {
        toast.error(result.error || "更新失败");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("更新失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const isOwnProfile =
    currentUser?.id === user.id;

  // 添加调试信息
  console.log('ProfilePageClient props:', {
    postsCount: posts?.length || 0,
    likedPostsCount: likedPosts?.length || 0,
    commentedPostsCount: commentedPosts?.length || 0,
    commentedPosts: commentedPosts
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">
            {/* Left side: Avatar and Username */}
            <div className="flex flex-col items-center space-y-3 md:w-48 flex-shrink-0" style={{justifyContent: 'center'}}>
              <div className="relative">
                <LazyAvatar className="w-32 h-32">
                  <LazyAvatarImage src={currentAvatar || "/avatar.png"} alt={user.username} />
                  <LazyAvatarFallback>{user.username?.charAt(0)?.toUpperCase() || '?'}</LazyAvatarFallback>
                </LazyAvatar>
                {isOwnProfile && (
                  <>
                    {/* 隐藏的文件输入 */}
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isAvatarUploading}
                    />
                    {/* 头像编辑按钮 */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full p-2 bg-white shadow-md"
                      onClick={triggerAvatarUpload}
                      disabled={isAvatarUploading}
                    >
                      {isAvatarUploading ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <EditIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </>
                )}
                {/* 头像上传状态提示 */}
                {isAvatarUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="text-white text-xs">上传中...</div>
                  </div>
                )}
              </div>
              <div className="text-center space-y-1">
                <h1 className="text-xl font-bold">{user.name || user.username}</h1>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>

            {/* Right side: User Info */}
            <div className="flex-1 space-y-4">
              {/* Top: Stats */}
              <div className="flex space-x-8">
                <button 
                  onClick={() => document.getElementById('posts-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-lg">{user._count?.posts || 0}</div>
                  <div className="text-muted-foreground text-sm">帖子</div>
                </button>
                
                <Link href={`/users/${user.id}/followers?tab=following`} className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <div className="font-semibold text-lg">{user._count?.following || 0}</div>
                  <div className="text-muted-foreground text-sm">关注</div>
                </Link>
                <Link href={`/users/${user.id}/followers?tab=followers`} className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <div className="font-semibold text-lg">{user._count?.followers || 0}</div>
                  <div className="text-muted-foreground text-sm">粉丝</div>
                </Link>
              </div>

              {/* Bio section */}
              {user.bio && (
                <div className="py-2">
                  <p className="text-gray-700 whitespace-pre-wrap leading-5">{user.bio}</p>
                </div>
              )}

              {/* Location (single line) */}
              {user.location && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPinIcon className="w-4 h-4 mr-2" />
                  {user.location}
                </div>
              )}

              {/* Website (single line) */}
              {user.website && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline truncate"
                  >
                    {user.website}
                  </a>
                </div>
              )}

              {/* Bottom: Join date and Edit button */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(new Date(user.createdAt), "MMMM yyyy")} 加入
                </div>
                
                <div className="flex space-x-2">
                  {!isOwnProfile && currentUser && (
                    <Button
                      onClick={handleFollow}
                      disabled={isLoading}
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                    >
                      {isLoading ? "..." : isFollowing ? "取消关注" : "关注"}
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Button
                      onClick={() => setShowEditDialog(true)}
                      variant="outline"
                      size="sm"
                    >
                      <EditIcon className="w-4 h-4 mr-2" />
                      编辑资料
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS FOR POSTS & LIKED POSTS */}
      <div id="posts-section" className="mt-6">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileTextIcon className="w-4 h-4" />
              帖子
            </TabsTrigger>
            {isOwnProfile && (
              <>
                <TabsTrigger value="liked" className="flex items-center gap-2">
                  <HeartIcon className="w-4 h-4" />
                  喜欢
                </TabsTrigger>
                <TabsTrigger value="commented" className="flex items-center gap-2">
                  <MessageCircleIcon className="w-4 h-4" />
                  评论
                </TabsTrigger>
              </>
            )}
          </TabsList>
          <TabsContent value="posts" className="mt-4">
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post: any) => <PostCard key={post.id} post={post} dbUserId={currentUser?.id || null} />)
              ) : (
                <p className="text-center py-8 text-muted-foreground">还没有发布任何帖子</p>
              )}
            </div>
          </TabsContent>
          {isOwnProfile && (
            <>
              <TabsContent value="liked" className="mt-4">
                <div className="space-y-4">
                  {likedPosts.length > 0 ? (
                    likedPosts.map((post: any) => <PostCard key={post.id} post={post} dbUserId={currentUser?.id || null} />)
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">还没有喜欢的帖子</p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="commented" className="mt-4">
                <div className="space-y-4">
                  {commentedPosts && commentedPosts.length > 0 ? (
                    commentedPosts.map((post: any) => <PostCard key={post.id} post={post} dbUserId={currentUser?.id || null} />)
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">还没有评论的帖子</p>
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* EDIT PROFILE DIALOG */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑个人资料</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={editFormData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="你的用户名"
                maxLength={20}
                minLength={3}
                className={usernameError ? "border-red-500" : ""}
              />
              <div className="text-xs mt-1">
                <div className="text-muted-foreground">
                  {editFormData.username.length}/20 (只能包含字母、数字和下划线，至少3个字符)
                </div>
                {usernameError && (
                  <div className="text-red-500 mt-1">{usernameError}</div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="你的姓名"
                maxLength={50}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {editFormData.name.length}/50
              </div>
            </div>
            <div>
              <Label htmlFor="bio">个人简介</Label>
              <Textarea
                id="bio"
                value={editFormData.bio}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="介绍一下自己..."
                className="min-h-[80px]"
                maxLength={120}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {editFormData.bio.length}/120 (建议不超过120字符以保持最佳显示效果)
              </div>
            </div>
            <div>
              <Label htmlFor="location">位置</Label>
              <Input
                id="location"
                value={editFormData.location}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="你在哪里？"
                maxLength={30}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {editFormData.location.length}/30
              </div>
            </div>
            <div>
              <Label htmlFor="website">网站</Label>
              <Input
                id="website"
                value={editFormData.website}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, website: e.target.value }))
                }
                placeholder="https://your-website.com"
                maxLength={100}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {editFormData.website.length}/100
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={isLoading || !!usernameError || !editFormData.username.trim()}
              >
                {isLoading ? "保存中..." : "保存更改"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  取消
                </Button>
              </DialogClose>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProfilePageClient;
