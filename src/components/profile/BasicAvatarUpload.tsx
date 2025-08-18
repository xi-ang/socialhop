'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api-client";

interface BasicAvatarUploadProps {
  initialImage?: string | null;
  userId: string;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  className?: string;
}

export default function BasicAvatarUpload({
  initialImage,
  userId,
  onAvatarUpdate,
  className = "w-32 h-32"
}: BasicAvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialImage || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.upload.uploadFile(formData) as any;
      
      if (response.success && response.data?.url) {
        const newAvatarUrl = response.data.url;
        setAvatarUrl(newAvatarUrl);
        onAvatarUpdate?.(newAvatarUrl);
        toast.success('头像上传成功！');
      } else {
        throw new Error(response.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('头像上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setAvatarUrl(null);
      onAvatarUpdate?.('');
      toast.success('头像已移除');
    } catch (error) {
      toast.error('移除头像失败');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className={className}>
          <AvatarImage src={avatarUrl || '/avatar.png'} alt="头像" />
          <AvatarFallback>
            <Camera className="w-8 h-8 text-gray-400" />
          </AvatarFallback>
        </Avatar>
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            id="avatar-upload"
          />
          <Button
            asChild
            disabled={isUploading}
            className="w-full"
          >
            <label htmlFor="avatar-upload" className="cursor-pointer">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  更换头像
                </>
              )}
            </label>
          </Button>
        </div>
        
        {avatarUrl && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRemoveAvatar}
            className="w-full"
            disabled={isUploading}
          >
            <X className="w-4 h-4 mr-2" />
            移除头像
          </Button>
        )}
      </div>
      
      <div className="text-xs text-gray-500 text-center max-w-xs">
        支持 JPG、PNG 格式，最大 4MB
      </div>
    </div>
  );
}
