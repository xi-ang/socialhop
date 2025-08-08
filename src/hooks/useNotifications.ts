import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { apiClient } from '@/lib/api-client';
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
      const result = await apiClient.notifications.getAll() as any;
      if (result.success) {
        dispatch(setNotifications(result.notifications));
      }
    } catch (error) {
      dispatch(setError('加载通知失败'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiClient.notifications.markAsRead(notificationId);
      dispatch(markAsRead(notificationId));
      return true;
    } catch (error) {
      dispatch(setError('标记已读失败'));
      return false;
    }
  }, [dispatch]);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await apiClient.notifications.markAllAsRead();
      dispatch(markAllAsRead());
      return true;
    } catch (error) {
      dispatch(setError('标记全部已读失败'));
      return false;
    }
  }, [dispatch]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await apiClient.notifications.delete(notificationId);
      dispatch(removeNotification(notificationId));
      return true;
    } catch (error) {
      dispatch(setError('删除通知失败'));
      return false;
    }
  }, [dispatch]);

  const updateNotificationSettings = useCallback(async (newSettings: any) => {
    try {
      await apiClient.notifications.updateSettings(newSettings);
      dispatch(updateSettings(newSettings));
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
