"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 *   Intersection Observer API 实现懒加载图片组件
 *  ✅ 性能优异：异步执行，不阻塞主线程
 *  ✅ 精确控制：可以精确控制触发时机
 *  ✅ 资源节约：比滚动监听消耗更少的CPU资源
 *  ✅ 现代化：Web标准，浏览器原生优化
 */
interface LazyImageProps {
  src: string;                    // 图片URL
  alt: string;                    // 替代文字
  className?: string;             // 样式类名
  placeholder?: string;           // 占位符图片（Base64）
  fallback?: string;              // 错误时显示的图片
  width?: number;                 // 宽度
  height?: number;                // 高度
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  onLoad?: () => void;            // 加载完成回调
  onError?: () => void;           // 加载错误回调
}
export function LazyImage({ 
  src, 
  alt, 
  className,
  // 00x200的灰色占位符SVG，转换为Base64
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlmYTJhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWKoOi9veS4rS4uLjwvdGV4dD48L3N2Zz4=",
  fallback = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlmYTJhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWKoOi9veiiq+eUvTwvdGV4dD48L3N2Zz4=",
  width,
  height,
  objectFit = "cover",
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);     // 图片是否加载完成
  const [isInView, setIsInView] = useState(false);     // 图片是否进入视口
  const [hasError, setHasError] = useState(false);     // 是否加载出错
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const currentImgRef = imgRef.current;
    if (!currentImgRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();  // 触发一次后即断开，提升性能
        }
      },
      {
        threshold: 0.1,    // 图片10%可见时触发回调
        rootMargin: "50px" // 提前50px开始加载
      }
    );

    observer.observe(currentImgRef);

    // // 检查元素是否已经在视口中
    // const rect = currentImgRef.getBoundingClientRect();
    // const isCurrentlyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    // if (isCurrentlyVisible) {
    //   setIsInView(true);
    //   observer.disconnect();
    // }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // 动态确定当前显示的图片源：初始状态（显示占位符），进入视口(显示加载器)，加载完成（显示图片），加载失败（显示错误图片）
  const currentSrc = hasError ? fallback : (isInView ? src : placeholder);

  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      style={{ width, height }}
    >
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoaded && !hasError ? "opacity-100" : "opacity-75",
          `object-${objectFit} w-full h-full`
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"  // 浏览器原生懒加载作为后备
      />
      
      {/* 加载状态指示器 */}
      {isInView && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
