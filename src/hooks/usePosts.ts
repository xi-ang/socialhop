import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import type { RootState, AppDispatch } from '@/store';
import { refreshPosts as refreshPostsAction } from '@/store/slices/postsSlice';

/**
 * 帖子刷新事件总线（瘦身版）
 *
 * 说明：
 * - 当前项目中，各页面自行管理帖子列表与乐观更新；
 * - 本 Hook 仅负责跨组件的“刷新信号”派发与订阅；
 * - 使用方式：组件调用 refreshPosts() 发出刷新事件；监听 refreshCounter 变化在本地触发实际加载。
 */
export function usePosts() {
  const dispatch = useDispatch<AppDispatch>();

  // 仅选择 refreshCounter，避免无关字段导致的重渲染
  const refreshCounter = useSelector((state: RootState) => state.posts.refreshCounter);

  const refreshPosts = useCallback(() => {
    dispatch(refreshPostsAction());
  }, [dispatch]);

  return {
    refreshCounter,
    refreshPosts,
  };
}
