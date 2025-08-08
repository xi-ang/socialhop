"use client";

import { useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera } from "lucide-react";
import { UploadDropzone, UploadButton } from "@/lib/uploadthing";
import toast from "react-hot-toast";

interface AvatarUploadImprovedProps {
  currentAvatar?: string;
  onAvatarChange: (newAvatarUrl: string) => void;
}

export default function AvatarUploadImproved({ currentAvatar, onAvatarChange }: AvatarUploadImprovedProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
                  src={currentAvatar || "/avatar.png"} 
                  alt="Avatar preview" 
                />
              </Avatar>
            </div>

            {/* UploadThing 上传组件 */}
            <div className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 rounded-lg transition-colors">
              <div className="p-6 text-center">
                <div className="mb-4">
                  <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-foreground mb-1">选择头像图片</h3>
                  <p className="text-xs text-muted-foreground">
                    支持 PNG、JPG、GIF，最大 4MB
                  </p>
                </div>
                
                <UploadButton
                  endpoint="singleImage"
                  onClientUploadComplete={(res) => {
                    const fileUrl = res?.[0]?.url;
                    if (fileUrl) {
                      onAvatarChange(fileUrl);
                      setIsUploading(false);
                      toast.dismiss('avatar-upload');
                      toast.success('头像上传成功！');
                      setShowUploadDialog(false);
                    }
                  }}
                  onUploadError={(error: Error) => {
                    console.error('Avatar upload error:', error);
                    setIsUploading(false);
                    toast.dismiss('avatar-upload');
                    toast.error(`头像上传失败: ${error.message}`);
                  }}
                  onUploadBegin={() => {
                    setIsUploading(true);
                    toast.loading('正在上传头像...', { id: 'avatar-upload' });
                  }}
                  appearance={{
                    button: "bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm w-full",
                  }}
                  content={{
                    button: isUploading ? "上传中..." : "选择图片",
                  }}
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowUploadDialog(false)}
                disabled={isUploading}
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
