"use client";

import { useState, useRef } from "react";
import { XIcon, ImageIcon, PlusIcon } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/lib/uploadthing";

interface MultiImageUploadProps {
  onChange: (urls: string[]) => void;
  value: string[];
  maxCount?: number;
}

function MultiImageUpload({ onChange, value = [], maxCount = 9 }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): string | null => {
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return '只支持 JPEG、PNG、GIF、WebP 格式的图片';
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return '图片大小不能超过 5MB';
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<string> => {
    // 此方法已弃用，现在直接使用 UploadThing
    throw new Error('请使用 UploadThing 上传');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // 此功能已迁移到 UploadThing 组件，不再使用传统文件选择
    event.preventDefault();
    toast.error('请使用下方的上传按钮');
  };

  const removeImage = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
    toast.success('图片已移除');
  };

  const canAddMore = value.length < maxCount;

  return (
    <div className="space-y-4">
      {/* 图片预览网格 */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={url}
                alt={`上传的图片 ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮 - 使用 UploadThing 云端上传 */}
      {canAddMore && (
        <div className="space-y-3">
          {/* UploadThing 上传按钮 */}
          <UploadButton
            endpoint="multipleImages"
            onClientUploadComplete={(res) => {
              const newUrls = res?.map(file => file.url).filter(Boolean) || [];
              if (newUrls.length > 0) {
                // 检查是否超过最大数量
                const totalFiles = value.length + newUrls.length;
                if (totalFiles > maxCount) {
                  const allowedCount = maxCount - value.length;
                  const allowedUrls = newUrls.slice(0, allowedCount);
                  onChange([...value, ...allowedUrls]);
                  toast.success(`已上传 ${allowedUrls.length} 张图片到云端`);
                  if (allowedUrls.length < newUrls.length) {
                    toast.error(`已达到最大上传数量限制 (${maxCount} 张)`);
                  }
                } else {
                  onChange([...value, ...newUrls]);
                  toast.success(`已上传 ${newUrls.length} 张图片到云端`);
                }
              }
              setUploading([]);
            }}
            onUploadError={(error: Error) => {
              console.error("Upload error:", error);
              toast.error(`上传失败: ${error.message}`);
              setUploading([]);
            }}
            onUploadBegin={() => {
              setUploading(['uploading']);
              toast.loading("正在上传到云端...", { id: "upload-progress" });
            }}
            onUploadProgress={(progress) => {
              console.log("Upload progress:", progress);
            }}
            appearance={{
              container: "w-full",
              button: "w-full h-32 bg-transparent border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors ut-uploading:bg-primary/5",
              allowedContent: "text-xs text-muted-foreground",
            }}
            content={{
              button: (
                <div className="flex flex-col items-center gap-2">
                  {uploading.length > 0 ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="text-sm">上传中...</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-6 w-6" />
                        <PlusIcon className="h-4 w-4" />
                      </div>
                      <span className="text-sm">点击上传图片到云端</span>
                      <span className="text-xs">
                        支持 JPEG、PNG、GIF、WebP，最大 4MB
                      </span>
                      <span className="text-xs">
                        ({value.length}/{maxCount})
                      </span>
                    </>
                  )}
                </div>
              ),
              allowedContent: `支持 JPEG、PNG、GIF、WebP，最大 4MB，最多 ${Math.max(0, maxCount - value.length)} 张`
            }}
          />
        </div>
      )}

      {!canAddMore && (
        <div className="text-center text-sm text-muted-foreground py-2">
          已达到最大上传数量 ({maxCount} 张)
        </div>
      )}
    </div>
  );
}

export default MultiImageUpload;
