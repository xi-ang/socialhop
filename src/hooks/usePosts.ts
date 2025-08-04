import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import type { RootState, AppDispatch } from '@/store';
import { 
  refreshPosts as refreshPostsAction,
  fetchPosts,
  toggleLike,
  optimisticToggleLike,
  addPost,
  removePost,
  updatePost,
  clearError,
} from '@/store/slices/postsSlice';

export function usePosts() {
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    posts,
    loading,
    error,
    pagination,
    refreshCounter,
  } = useSelector((state: RootState) => state.posts);

  // 刷新帖子（触发其他组件重新加载）
  const refreshPosts = useCallback(() => {
    dispatch(refreshPostsAction());
  }, [dispatch]);

  // 获取帖子列表
  const loadPosts = useCallback((page = 1, limit = 10) => {
    return dispatch(fetchPosts({ page, limit }));
  }, [dispatch]);

  // 点赞/取消点赞
  const handleToggleLike = useCallback((postId: string, hasLiked: boolean) => {
    // 乐观更新
    dispatch(optimisticToggleLike({ postId, hasLiked }));
    // 发送请求
    dispatch(toggleLike({ postId }));
  }, [dispatch]);

  // 添加新帖子
  const addNewPost = useCallback((post: any) => {
    dispatch(addPost(post));
  }, [dispatch]);

  // 删除帖子
  const deletePost = useCallback((postId: string) => {
    dispatch(removePost(postId));
  }, [dispatch]);

  // 更新帖子
  const editPost = useCallback((id: string, updates: any) => {
    dispatch(updatePost({ id, updates }));
  }, [dispatch]);

  // 清除错误
  const clearPostsError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    posts,
    loading,
    error,
    pagination,
    refreshCounter,
    
    // Actions
    refreshPosts,
    loadPosts,
    handleToggleLike,
    addNewPost,
    deletePost,
    editPost,
    clearPostsError,
  };
}
