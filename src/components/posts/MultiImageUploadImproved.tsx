"use client";

import { useState } from "react";
import { XIcon, UploadIcon } from "lucide-react";
import toast from "react-hot-toast";
import { UploadDropzone, UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";

interface MultiImageUploadProps {
  onChange: (urls: string[]) => void;
  value?: string[];
  maxCount?: number;
}

function MultiImageUploadImproved({ 
  onChange, 
  value = [], 
  maxCount = 9
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const removeImage = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
    toast.success('图片已移除');
  };

  const canAddMore = value.length < maxCount;

  return (
    <div className="space-y-4">
      {/* 图片预览网格 */}
      {(value.length > 0 || uploadingFiles.length > 0) && (
        <div className="grid grid-cols-3 gap-3">
          {/* 已上传的图片 */}
          {value.map((url, index) => (
            <div key={`uploaded-${index}`} className="relative group aspect-square">
              <img
                src={url}
                alt={`上传的图片 ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                type="button"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {/* 正在上传的图片预览 */}
          {uploadingFiles.map((previewUrl, index) => (
            <div key={`uploading-${index}`} className="relative group aspect-square">
              <img
                src={previewUrl}
                alt={`正在上传的图片 ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border opacity-75"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
                <div className="w-3/4 space-y-2">
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground font-medium">
                    {progress}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 文件上传区域 */}
      {canAddMore && (
        <div className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 rounded-lg transition-colors">
          <div className="p-6 text-center">
            <div className="mb-4">
              <UploadIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-sm font-medium text-foreground mb-1">点击选择图片</h3>
              <p className="text-xs text-muted-foreground">
                支持 JPEG、PNG、GIF、WebP，最大 4MB
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ({value.length}/{maxCount}) 张图片
              </p>
            </div>
            
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
                    toast.dismiss('upload-progress');
                    toast.success(`已上传 ${allowedUrls.length} 张图片`);
                    if (allowedUrls.length < newUrls.length) {
                      toast.error(`已达到最大上传数量限制 (${maxCount} 张)`);
                    }
                  } else {
                    onChange([...value, ...newUrls]);
                    toast.dismiss('upload-progress');
                    toast.success(`图片上传成功！已上传 ${newUrls.length} 张`);
                  }
                }
                setUploading(false);
                setProgress(0);
                setUploadingFiles([]);
              }}
              onUploadError={(error: Error) => {
                console.error('Upload error:', error);
                toast.dismiss('upload-progress');
                toast.error(`上传失败: ${error.message}`);
                setUploading(false);
                setProgress(0);
                setUploadingFiles([]);
              }}
              onUploadBegin={(fileName) => {
                setUploading(true);
                toast.loading('图片正在上传...', { id: 'upload-progress' });
              }}
              onUploadProgress={(progress) => {
                setProgress(Math.round(progress));
              }}
              onBeforeUploadBegin={(files) => {
                // 预览上传前的图片
                const filePreviewUrls = Array.from(files).map(file => URL.createObjectURL(file));
                
                // 如果总数超过最大值，只显示允许的数量
                const allowedCount = maxCount - value.length;
                const previewUrls = filePreviewUrls.slice(0, allowedCount);
                
                setUploadingFiles(previewUrls);
                return files;
              }}
              appearance={{
                button: "bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm",
              }}
              content={{
                button: uploading ? "上传中..." : "选择图片",
              }}
              disabled={uploading}
            />
            
            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">上传进度：{progress}%</p>
              </div>
            )}
          </div>
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

export default MultiImageUploadImproved;
