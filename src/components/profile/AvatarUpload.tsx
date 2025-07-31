"use client";

import { useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Upload, X } from "lucide-react";
import toast from "react-hot-toast";

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (newAvatarUrl: string) => void;
}

export default function AvatarUpload({ currentAvatar, onAvatarChange }: AvatarUploadProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setSelectedFile(file);
    
    // 创建预览URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (data.success) {
        onAvatarChange(data.url);
        toast.success('头像上传成功！');
        setShowUploadDialog(false);
        setPreviewUrl(null);
        setSelectedFile(null);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('头像上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setShowUploadDialog(false);
  };

  return (
    <>
      <div className="relative group">
        <Avatar className="w-32 h-32">
          <AvatarImage src={currentAvatar || "/avatar.png"} alt="User avatar" />
        </Avatar>
        
        {/* 悬停时显示上传按钮 */}
        <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-white"
            onClick={() => setShowUploadDialog(true)}
          >
            <Camera className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 上传对话框 */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>更换头像</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 当前头像预览 */}
            <div className="flex justify-center">
              <Avatar className="w-32 h-32">
                <AvatarImage 
                  src={previewUrl || currentAvatar || "/avatar.png"} 
                  alt="Avatar preview" 
                />
              </Avatar>
            </div>

            {/* 文件选择 */}
            <div className="space-y-2">
              <label 
                htmlFor="avatar-upload" 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">点击上传</span> 或拖拽文件
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF (最大 5MB)</p>
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || isUploading}
                className="flex-1"
              >
                {isUploading ? "上传中..." : "确认上传"}
              </Button>
              <Button 
                variant="outline" 
                onClick={cancelUpload}
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
