import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const timeDiff = now.getTime() - date.getTime();
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  
  // 如果超过24小时，显示日期
  if (hours >= 24) {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
  
  // 24小时内显示相对时间
  return formatDistanceToNow(date, { 
    addSuffix: true, 
    locale: zhCN 
  });
}
