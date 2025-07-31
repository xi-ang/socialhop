"use client";

import { useState } from "react";
import { X, Download, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ImageGridProps {
  images: string[];
  className?: string;
}

interface ImagePreviewProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

// 图片预览对话框组件
function ImagePreview({ images, currentIndex, onClose, onNext, onPrev }: ImagePreviewProps) {
  const currentImage = images[currentIndex];

  const downloadImage = async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-4 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>图片预览 ({currentIndex + 1}/{images.length})</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadImage}
                className="h-8"
              >
                <Download className="h-4 w-4 mr-1" />
                下载
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex items-center justify-center p-4 min-h-0">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={currentImage}
              alt={`图片 ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {/* 导航按钮 */}
            {images.length > 1 && (
              <>
                <button
                  onClick={onPrev}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  disabled={currentIndex === 0}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={onNext}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  disabled={currentIndex === images.length - 1}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* 底部缩略图 */}
        {images.length > 1 && (
          <div className="p-4 border-t">
            <div className="flex gap-2 justify-center overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const diff = index - currentIndex;
                    if (diff > 0) {
                      for (let i = 0; i < diff; i++) onNext();
                    } else if (diff < 0) {
                      for (let i = 0; i < Math.abs(diff); i++) onPrev();
                    }
                  }}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentIndex ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image}
                    alt={`缩略图 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// 主图片网格组件
function ImageGrid({ images, className = "" }: ImageGridProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const openPreview = (index: number) => {
    setPreviewIndex(index);
  };

  const closePreview = () => {
    setPreviewIndex(null);
  };

  const nextImage = () => {
    if (previewIndex !== null && previewIndex < images.length - 1) {
      setPreviewIndex(previewIndex + 1);
    }
  };

  const prevImage = () => {
    if (previewIndex !== null && previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
    }
  };

  // 根据图片数量决定布局
  const getGridClass = () => {
    switch (images.length) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2";
      case 4:
        return "grid-cols-2";
      case 5:
        return "grid-cols-3";
      case 6:
        return "grid-cols-3";
      case 7:
      case 8:
      case 9:
        return "grid-cols-3";
      default:
        return "grid-cols-3";
    }
  };

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent, imageUrl: string, index: number) => {
    e.preventDefault();
    
    // 创建自定义右键菜单
    const contextMenu = document.createElement('div');
    contextMenu.className = 'fixed bg-white border rounded-lg shadow-lg p-2 z-50';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    
    const downloadItem = document.createElement('button');
    downloadItem.className = 'w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2';
    downloadItem.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> 下载图片';
    
    downloadItem.onclick = async () => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `image-${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
      }
      document.body.removeChild(contextMenu);
    };
    
    contextMenu.appendChild(downloadItem);
    document.body.appendChild(contextMenu);
    
    // 点击其他地方关闭菜单
    const closeMenu = () => {
      if (document.body.contains(contextMenu)) {
        document.body.removeChild(contextMenu);
      }
      document.removeEventListener('click', closeMenu);
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 100);
  };

  return (
    <>
      <div className={`rounded-lg overflow-hidden ${className}`}>
        <div className={`grid gap-1 ${getGridClass()}`}>
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative group cursor-pointer ${
                images.length === 3 && index === 0 ? 'row-span-2' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡
                openPreview(index);
              }}
              onContextMenu={(e) => handleContextMenu(e, image, index)}
            >
              <img
                src={image}
                alt={`图片 ${index + 1}`}
                className={`w-full object-cover ${
                  images.length === 1 ? 'max-h-96' : 'h-32 sm:h-40'
                }`}
              />
              
              {/* 悬停时显示放大图标 */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 图片预览对话框 */}
      {previewIndex !== null && (
        <ImagePreview
          images={images}
          currentIndex={previewIndex}
          onClose={closePreview}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}
    </>
  );
}

export default ImageGrid;
