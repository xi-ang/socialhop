"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { LazyAvatar, LazyAvatarImage, LazyAvatarFallback } from "@/components/ui/lazy-avatar";
import { UploadButton } from "@/lib/uploadthing";

interface SimpleUploadAvatarProps {
  userId: string;
  avatarUrl?: string;
  onUploadSuccess: (url: string) => void;
}

function SimpleUploadAvatar({ userId, avatarUrl, onUploadSuccess }: SimpleUploadAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="relative inline-block">
      {/* 头像显示区域 */}
      <div 
        className="relative overflow-hidden rounded-full border-4 border-white shadow-lg transition-all duration-300 hover:shadow-xl cursor-pointer group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <LazyAvatar className="w-32 h-32">
          <LazyAvatarImage 
            src={avatarUrl || ''} 
            alt="Avatar" 
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <LazyAvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/40 text-primary">
            {userId?.charAt(0)?.toUpperCase() || '?'}
          </LazyAvatarFallback>
        </LazyAvatar>
        
        {/* 悬停遮罩 */}
        {(isHovering || isUploading) && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 rounded-full">
            {isUploading ? (
              <div className="text-white text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-1" />
                <div className="text-xs font-medium">上传中...</div>
              </div>
            ) : (
              <div className="text-white text-center">
                <Camera className="w-8 h-8 mx-auto mb-1" />
                <div className="text-xs font-medium">点击更换</div>
              </div>
            )}
          </div>
        )}
        
        {/* 隐藏的上传按钮 - 覆盖整个头像区域 */}
        <div className="absolute inset-0 opacity-0">
          <UploadButton
            endpoint="singleImage"
            onClientUploadComplete={(res) => {
              setIsUploading(false);
              if (res?.[0]?.url) {
                onUploadSuccess(res[0].url);
                toast.success("头像上传成功！", {
                  icon: "🎉",
                  duration: 3000,
                });
              }
            }}
            onUploadError={(error: Error) => {
              setIsUploading(false);
              toast.error(`上传失败: ${error.message}`, {
                icon: "❌",
              });
            }}
            onUploadBegin={() => {
              setIsUploading(true);
              toast.loading("正在上传头像...", { 
                id: "avatar-upload",
                icon: "📤"
              });
            }}
            appearance={{
              container: "w-full h-full",
              button: `
                w-full h-full rounded-full
                bg-transparent border-0 outline-none
                cursor-pointer opacity-0
                focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
              `,
              allowedContent: "hidden"
            }}
            content={{
              button: "",
              allowedContent: ""
            }}
          />
        </div>
      </div>
      
      {/* 装饰性边框 */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
    </div>
  );
}

export default SimpleUploadAvatar;
