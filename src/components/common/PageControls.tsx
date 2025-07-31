'use client';

import { Button } from '@/components/ui/button';
import { ArrowUpIcon, RefreshCwIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

type PageControlsProps = {
  onRefresh: () => void;
  isRefreshing?: boolean;
};

export default function PageControls({ onRefresh, isRefreshing = false }: PageControlsProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScrollTop = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, []);

  const handleRefresh = () => {
    // 先置顶，再刷新
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // 等待滚动完成后再刷新
    setTimeout(() => {
      onRefresh();
    }, 300);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50">
      <div className="flex flex-col space-y-3">
        {/* 刷新按钮 */}
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          size="sm"
          className="h-12 w-12 rounded-full shadow-lg"
          title="刷新并置顶"
        >
          <RefreshCwIcon 
            className={`size-5 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
        </Button>

        {/* 置顶按钮 */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            size="sm"
            variant="outline"
            className="h-12 w-12 rounded-full shadow-lg"
            title="回到顶部"
          >
            <ArrowUpIcon className="size-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
