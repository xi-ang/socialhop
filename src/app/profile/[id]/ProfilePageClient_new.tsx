"use client";

import { getProfileById, getUserPosts, updateProfile, updateAvatar } from "@/actions/profile.action";
import { toggleFollow } from "@/actions/user.action";
import PostCard from "@/components/posts/PostCard";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
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
import { useAuth } from '@/hooks/useAuth';
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
import AvatarUpload from "@/components/profile/AvatarUpload";

type User = Awaited<ReturnType<typeof getProfileById>>;
type Posts = Awaited<ReturnType<typeof getUserPosts>>;

interface Props {
  user: User;
  posts: Posts;
  isCurrentUser: boolean;
}

interface EditFormData {
  bio: string;
  location: string;
  website: string;
}

export default function ProfilePageClient({ user, posts, isCurrentUser }: Props) {
  const { user: currentUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isEditFormLoading, setIsEditFormLoading] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
  });

  const handleFollow = async () => {
    try {
      setIsLoading(true);
      await toggleFollow(user.id);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("操作失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsEditFormLoading(true);
      await updateProfile({
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
      });
      toast.success("个人资料已更新");
      setIsDialogOpen(false);
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("更新失败");
    } finally {
      setIsEditFormLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className="w-32 h-32">
                <AvatarImage src={user.image || "/images/default-avatar.png"} alt={user.username} />
              </Avatar>
              {isCurrentUser && <AvatarUpload userId={user.id} />}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left min-h-[180px] flex flex-col justify-between">
              {/* Top section: Name and buttons */}
              <div>
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 mb-4">
                  <h1 className="text-2xl font-bold">{user.username}</h1>
                  {!isCurrentUser && currentUser && (
                    <Button
                      onClick={handleFollow}
                      disabled={isLoading}
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                    >
                      {isLoading ? "..." : isFollowing ? "取消关注" : "关注"}
                    </Button>
                  )}
                  {isCurrentUser && (
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      variant="outline"
                      size="sm"
                    >
                      <EditIcon className="w-4 h-4 mr-2" />
                      编辑资料
                    </Button>
                  )}
                </div>

                {/* Bio section - fixed height to prevent layout shift */}
                <div className="min-h-[60px] mb-4">
                  {user.bio && (
                    <p className="text-gray-700 whitespace-pre-wrap line-clamp-4 leading-5">{user.bio}</p>
                  )}
                </div>

                {/* Location, website, join date */}
                <div className="flex flex-col space-y-2 text-sm text-muted-foreground mb-4">
                  {user.location && (
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      {user.location}
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center">
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
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(new Date(user.createdAt), "MMMM yyyy")} 加入
                  </div>
                </div>
              </div>

              {/* Bottom section: Stats - properly aligned */}
              <div className="flex justify-center md:justify-start space-x-8">
                <div className="text-center">
                  <div className="font-semibold">{user._count?.posts || 0}</div>
                  <div className="text-muted-foreground">帖子</div>
                </div>
                <Link href={`/users/${user.id}/followers?tab=following`} className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <div className="font-semibold">{user._count?.following || 0}</div>
                  <div className="text-muted-foreground">关注</div>
                </Link>
                <Link href={`/users/${user.id}/followers?tab=followers`} className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <div className="font-semibold">{user._count?.followers || 0}</div>
                  <div className="text-muted-foreground">粉丝</div>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts" className="flex items-center">
            <FileTextIcon className="w-4 h-4 mr-2" />
            帖子
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex items-center">
            <HeartIcon className="w-4 h-4 mr-2" />
            喜欢
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex items-center">
            <MessageCircleIcon className="w-4 h-4 mr-2" />
            回复
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                还没有发布任何帖子
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </TabsContent>

        <TabsContent value="likes" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              喜欢的帖子功能即将上线
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replies" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              回复功能即将上线
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑个人资料</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bio">个人简介</Label>
              <Textarea
                id="bio"
                placeholder="介绍一下自己..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="mt-1"
                rows={3}
                maxLength={120}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.bio.length}/120 (建议不超过120字符以保持最佳显示效果)
              </div>
            </div>
            <div>
              <Label htmlFor="location">位置</Label>
              <Input
                id="location"
                placeholder="你在哪里？"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1"
                maxLength={30}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.location.length}/30
              </div>
            </div>
            <div>
              <Label htmlFor="website">网站</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="mt-1"
                maxLength={100}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.website.length}/100
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex justify-end space-x-2">
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button onClick={handleSaveProfile} disabled={isEditFormLoading}>
              {isEditFormLoading ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
