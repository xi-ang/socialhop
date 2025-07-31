"use client";

import { useState, useRef } from "react";
import { XIcon, ImageIcon, PlusIcon } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

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
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '上传失败');
    }

    const result = await response.json();
    return result.url;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // 检查数量限制
    if (value.length + files.length > maxCount) {
      toast.error(`最多只能上传 ${maxCount} 张图片`);
      return;
    }

    // 验证所有文件
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        return;
      }
    }

    // 开始上传
    const uploadIds = files.map(() => Math.random().toString(36).substring(2, 15));
    setUploading(prev => [...prev, ...uploadIds]);

    try {
      const uploadPromises = files.map(async (file, index) => {
        const uploadId = uploadIds[index];
        try {
          toast.loading(`正在上传 ${file.name}...`, { id: uploadId });
          const url = await uploadFile(file);
          toast.success(`${file.name} 上传成功！`, { id: uploadId });
          return url;
        } catch (error) {
          toast.error(`${file.name} 上传失败: ${error instanceof Error ? error.message : '未知错误'}`, { id: uploadId });
          throw error;
        }
      });

      const urls = await Promise.all(uploadPromises);
      onChange([...value, ...urls]);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(prev => prev.filter(id => !uploadIds.includes(id)));
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

      {/* 上传按钮 */}
      {canAddMore && (
        <div className="flex flex-col items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleFileSelect}
            disabled={uploading.length > 0}
            className="w-full h-32 border-dashed border-2 hover:border-primary/50 transition-colors"
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
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
                  <span className="text-sm">点击上传图片</span>
                  <span className="text-xs">
                    支持 JPEG、PNG、GIF、WebP，最大 5MB
                  </span>
                  <span className="text-xs">
                    ({value.length}/{maxCount})
                  </span>
                </>
              )}
            </div>
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
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
