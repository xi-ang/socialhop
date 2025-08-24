"use client";

import { useAuth } from '@/hooks/useAuth';
import { useState } from "react";
import { useDispatch } from "react-redux";
import { refreshPosts } from "@/store/slices/postsSlice";
import { Card, CardContent } from "@/components/ui/card";
import { LazyAvatar, LazyAvatarImage, LazyAvatarFallback } from "@/components/ui/lazy-avatar";
import { ImageIcon, Loader2Icon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import toast from "react-hot-toast";
import SmartImageUpload from "./SmartImageUpload";
import MentionInput from "./MentionInput";
import { sanitizeInput, detectXSS } from "@/lib/security";

function CreatePost() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [mentions, setMentions] = useState<{ userId: string; username: string }[]>([]);

  if (!user) return null;

  const handleMention = (userId: string, username: string) => {
    setMentions(prev => {
      // 避免重复添加同一个用户
      if (prev.some(m => m.userId === userId)) {
        return prev;
      }
      return [...prev, { userId, username }];
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      toast.error("请输入内容或添加图片");
      return;
    }

    // 安全检查
    const sanitizedContent = sanitizeInput(content);
    if (detectXSS(sanitizedContent)) {
      toast.error("内容包含不安全字符，请检查后重试");
      return;
    }

    setIsPosting(true);

    try {
      let response;
      
      if (images.length > 0) {
        // 如果有图片，使用 FormData 方式
        const formData = new FormData();
        formData.append('content', sanitizedContent);
        
        // 添加图片数据
        images.forEach((imageUrl, index) => {
          if (index === 0) {
            formData.append('image', imageUrl); // 向后兼容
          }
          formData.append('images', imageUrl);
        });
        
        // 添加提及的用户
        mentions.forEach(mention => {
          formData.append('mentions', mention.userId);
        });
        
        response = await apiClient.posts.createWithFormData(formData);
      } else {
        // 没有图片，使用常规方式
        response = await apiClient.posts.create(sanitizedContent);
      }
      
      if (response) {
        setContent("");
        setImages([]);
        setMentions([]);
        setShowImageUpload(false);
        dispatch(refreshPosts());
        toast.success("帖子发布成功！");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("发布失败，请重试");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <LazyAvatar className="w-10 h-10 flex-shrink-0">
            <LazyAvatarImage 
              src={user.image || "/avatar.png"} 
              alt={user.name || user.username}
            />
            <LazyAvatarFallback>{user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || '?'}</LazyAvatarFallback>
          </LazyAvatar>
          
          <div className="flex-1 space-y-3">
            <MentionInput
              value={content}
              onChange={setContent}
              onMentionAdd={handleMention}
              placeholder={`${user.name || user.username}，分享一些新鲜事...`}
              className="min-h-[80px] resize-none border-none p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0"
            />

            {/* 图片上传区域 */}
            {(showImageUpload || images.length > 0) && (
              <div className="mt-3">
                <SmartImageUpload
                  value={images}
                  onChange={(urls: string[]) => {
                    setImages(urls);
                    if (urls.length === 0) setShowImageUpload(false);
                  }}
                  maxCount={9}
                />
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowImageUpload(!showImageUpload)}
                className="text-primary hover:text-primary/80"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                图片
              </Button>

              <Button 
                onClick={handleSubmit} 
                disabled={isPosting || (!content.trim() && images.length === 0)}
                size="sm"
                className="px-6"
              >
                {isPosting ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <SendIcon className="w-4 h-4 mr-2" />
                    发布
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CreatePost;
