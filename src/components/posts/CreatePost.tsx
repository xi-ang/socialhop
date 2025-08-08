"use client";

import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ImageIcon, Loader2Icon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPost } from "@/actions/post.action";
import toast from "react-hot-toast";
import MultiImageUploadImproved from "./MultiImageUploadImproved";
import MentionInput from "./MentionInput";
import { sanitizeInput, detectXSS } from "@/lib/security";

function CreatePost() {
  const { user } = useAuth();
  const { refreshPosts } = usePosts();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [mentions, setMentions] = useState<{ userId: string; username: string }[]>([]);

  const handleContentChange = (newContent: string) => {
    // 基本安全检查
    if (detectXSS(newContent)) {
      toast.error("内容包含不允许的字符，请重新输入");
      return;
    }
    
    const sanitized = sanitizeInput(newContent, 280);
    setContent(sanitized);
  };

  const handleMentionAdd = (userId: string, username: string) => {
    setMentions(prev => {
      // 避免重复添加
      if (prev.some(m => m.userId === userId)) {
        return prev;
      }
      return [...prev, { userId, username }];
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return;

    // 最终安全检查
    if (detectXSS(content)) {
      toast.error("内容包含不安全的字符");
      return;
    }

    setIsPosting(true);
    try {
      const result = await createPost(content, images, mentions);
      if (result?.success) {
        // reset the form
        setContent("");
        setImages([]);
        setMentions([]);
        setShowImageUpload(false);

        // 刷新帖子列表
        refreshPosts();

        toast.success("发布成功");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("发布失败");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.image || "/avatar.png"} />
            </Avatar>
            <div className="flex-1">
              <MentionInput
                value={content}
                onChange={handleContentChange}
                onMentionAdd={handleMentionAdd}
                placeholder="分享你的想法... (输入@可以提及其他用户)"
                className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base"
                maxLength={280}
              />
              <div className="text-xs text-muted-foreground mt-2">
                {content.length}/280
                {mentions.length > 0 && (
                  <span className="ml-2">
                    · 提及了 {mentions.length} 个用户
                  </span>
                )}
              </div>
            </div>
          </div>

          {(showImageUpload || images.length > 0) && (
            <div className="border rounded-lg p-4">
              <MultiImageUploadImproved
                value={images}
                onChange={(urls) => {
                  setImages(urls);
                  if (urls.length === 0) setShowImageUpload(false);
                }}
                maxCount={9}
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                onClick={() => setShowImageUpload(!showImageUpload)}
                disabled={isPosting}
              >
                <ImageIcon className="size-4 mr-2" />
                图片 ({images.length}/9)
              </Button>
            </div>
            <Button
              className="flex items-center"
              onClick={handleSubmit}
              disabled={(!content.trim() && images.length === 0) || isPosting}
            >
              {isPosting ? (
                <>
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                  发布中...
                </>
              ) : (
                <>
                  <SendIcon className="size-4 mr-2" />
                  发布
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default CreatePost;
