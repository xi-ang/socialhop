import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { apiClient } from '@/lib/api-client';
import { 
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  setUnreadCount,
  setLoading,
  setError,
} from '@/store/slices/notificationsSlice';

/**
 * 通知领域 Hook（瘦身版）
 *
 * 职责：
 * - 统一从 Redux 读取通知列表/未读数/加载态/错误态
 * - 提供被真实使用的操作：加载列表、单条/全部已读、添加新通知、设置未读数
 * 说明：
 * - 诸如删除通知、更新通知设置等操作目前未在页面中使用，故不在本 Hook 暴露，避免 API 面过大；
 * - 如后续需要，可再逐步按需补充，保持“用多少、暴露多少”的最小原则。
 */
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

  const addNewNotification = useCallback((notification: any) => {
    dispatch(addNotification(notification));
  }, [dispatch]);

  const updateUnreadCount = useCallback((count: number) => {
    dispatch(setUnreadCount(count));
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
    addNotification: addNewNotification,
    setUnreadCount: updateUnreadCount,
  };
}
