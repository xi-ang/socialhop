import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  setUnreadCount,
  updateSettings,
  setLoading,
  setError,
  clearError 
} from '@/store/slices/notificationsSlice';

// 通知相关的 hook
export function useNotifications() {
  const dispatch = useAppDispatch();
  const notificationsState = useAppSelector((state) => {
    // console.log('Redux state.notifications:', state.notifications);
    return state.notifications;
  });
  
  // 防御性编程：如果 notifications state 未定义，使用默认值
  const { 
    notifications = [], 
    unreadCount = 0, 
    settings = { likes: true, comments: true, follows: true, mentions: true }, 
    loading = false, 
    error = null 
  } = notificationsState || {};

  const loadNotifications = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          dispatch(setNotifications(result.notifications));
        }
      }
    } catch (error) {
      dispatch(setError('加载通知失败'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        dispatch(markAsRead(notificationId));
        return true;
      }
      return false;
    } catch (error) {
      dispatch(setError('标记已读失败'));
      return false;
    }
  }, [dispatch]);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        credentials: 'include',
      });
      
      if (response.ok) {
        dispatch(markAllAsRead());
        return true;
      }
      return false;
    } catch (error) {
      dispatch(setError('标记全部已读失败'));
      return false;
    }
  }, [dispatch]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        dispatch(removeNotification(notificationId));
        return true;
      }
      return false;
    } catch (error) {
      dispatch(setError('删除通知失败'));
      return false;
    }
  }, [dispatch]);

  const updateNotificationSettings = useCallback(async (newSettings: any) => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
        credentials: 'include',
      });
      
      if (response.ok) {
        dispatch(updateSettings(newSettings));
      }
    } catch (error) {
      dispatch(setError('更新设置失败'));
    }
  }, [dispatch]);

  const addNewNotification = useCallback((notification: any) => {
    dispatch(addNotification(notification));
  }, [dispatch]);

  const updateUnreadCount = useCallback((count: number) => {
    dispatch(setUnreadCount(count));
  }, [dispatch]);

  const clearNotificationError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    notifications,
    unreadCount,
    settings,
    loading,
    error,
    loadNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification,
    updateSettings: updateNotificationSettings,
    addNotification: addNewNotification,
    setUnreadCount: updateUnreadCount,
    clearError: clearNotificationError,
  };
}
