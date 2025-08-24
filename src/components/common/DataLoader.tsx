'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useDispatch } from 'react-redux';
import { refreshPosts } from '@/store/slices/postsSlice';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';

/**
 * 全局数据加载器组件
 * 负责在用户登录时初始化应用数据和WebSocket连接
 */
// 全局接驳器：
// - 在用户登录后初始化通知列表
// - 监听 ws Hook 的通知与未读数输出，做 UI 级兜底与 Redux 写入
// - 收到评论通知时触发首页刷新，尽快同步评论数
export function DataLoader() {
  const { user, isAuthenticated } = useAuth();
  const { loadNotifications, addNotification, setUnreadCount } = useNotifications();
  const dispatch = useDispatch();
  
  console.log('🔄 DataLoader rendered, user:', user?.id, 'authenticated:', isAuthenticated);
  
  // 🎯 集成 WebSocket 实时未读数量通知
  const { 
    isConnected, 
    unreadCount, 
    notifications: wsNotifications 
  } = useNotificationWebSocket();

  console.log('📡 WebSocket状态 - 连接:', isConnected, '未读:', unreadCount, '通知数:', wsNotifications.length);

  useEffect(() => {
    if (isAuthenticated && user) {
      // 用户登录时加载通知数据
      loadNotifications();
    }
  }, [isAuthenticated, user, loadNotifications]);

  // 🎯 处理 WebSocket 接收到的新通知
  useEffect(() => {
    if (wsNotifications.length > 0) {
      const latestNotification = wsNotifications[0];
      console.log('🔔 DataLoader: 收到新的 WebSocket 通知', latestNotification);
      // 规范化：为 WS 实时通知补齐帖子预览内容，避免 content 为空需要手动刷新
      const n: any = latestNotification as any;
      let post = n.post;
      // 若没有附带 post，但存在 postId，则构造一个最小 post
      if (!post && n.postId) {
        post = { id: n.postId, content: null, image: null };
      }
      let previewContent: string | null | undefined = post?.content;
      if (!previewContent || previewContent === '') {
        if (n.type === 'COMMENT' && n.comment?.content) {
          previewContent = n.comment.content;
        } else if (post?.image) {
          previewContent = '[图片]';
        }
      }
      const normalized = {
        ...n,
        post: post ? { ...post, content: previewContent ?? '' } : (previewContent ? { id: n.postId, content: previewContent, image: null } : undefined)
      } as any;

      // 将规范化后的通知添加到 Redux store
      addNotification(normalized);
      console.log('✅ DataLoader: 通知已添加到 Redux store');

      // 如果是评论通知，刷新帖子流以更新评论数
      if (latestNotification.type === 'COMMENT') {
        try {
          dispatch(refreshPosts());
        } catch {}
      }
    }
  }, [wsNotifications, addNotification]);

  // 🎯 同步 WebSocket 未读数量到 Redux
  useEffect(() => {
    console.log('📊 同步未读数量: WebSocket =', unreadCount);
    if (unreadCount >= 0) { // 只有当未读数量是有效值时才同步
      console.log('🔄 调用 setUnreadCount，更新 Redux 为:', unreadCount);
      setUnreadCount(unreadCount);
    }
  }, [unreadCount, setUnreadCount]);

  // // 🎯 监控 Redux 中的未读数量变化
  // const { unreadCount: reduxUnreadCount } = useNotifications();
  // useEffect(() => {
  //   console.log('📈 Redux 未读数量变化:', reduxUnreadCount);
  // }, [reduxUnreadCount]);

  return null; // 这是一个无UI组件
}
