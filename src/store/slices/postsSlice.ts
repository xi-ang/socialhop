import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api-client';

interface Post {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    name: string;
    image?: string;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
  _count: {
    likes: number;
    comments: number;
  };
  hasLiked?: boolean;
  lastOperationId?: string; // 乐观更新操作ID，用于防止竞态条件
  isOptimistic?: boolean; // 是否为乐观更新状态，用于UI显示
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

interface PostsState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  refreshCounter: number;
}

const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  },
  refreshCounter: 0,
};

// 异步thunk - 获取帖子列表
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async ({ page = 1, limit = 10 }: { page?: number; limit?: number } = {}) => {
    const result = await apiClient.posts.getAll(page, limit) as any;
    
    if (result.success) {
      return {
        posts: result.data.posts,
        pagination: result.data.pagination,
      };
    }
    
    throw new Error('Failed to fetch posts');
  }
);

/**
 * 异步thunk - 点赞/取消点赞（简化版）
 * 实现基础的乐观更新流程，包含防竞态条件和自动回滚
 */
export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async ({ postId }: { postId: string }, { getState, dispatch }) => {
    const state = getState() as { posts: PostsState };
    const post = state.posts.posts.find(p => p.id === postId);
    
    if (!post) {
      throw new Error('Post not found');
    }

    // 生成操作ID防止竞态条件
    const operationId = `${postId}-${Date.now()}`;
    
    // 立即乐观更新UI
    dispatch(optimisticToggleLike({ 
      postId, 
      hasLiked: !post.hasLiked,
      operationId 
    }));

    try {
      const result = await apiClient.posts.toggleLike(postId) as any;
      
      // 验证操作是否仍然有效
      const currentState = getState() as { posts: PostsState };
      const currentPost = currentState.posts.posts.find(p => p.id === postId);
      
      if (currentPost?.lastOperationId !== operationId) {
        // 有其他操作，返回当前状态
        return { 
          postId, 
          hasLiked: currentPost?.hasLiked || false, 
          likesCount: currentPost?._count.likes || 0 
        };
      }

      return { 
        postId, 
        hasLiked: result.success ? !post.hasLiked : post.hasLiked, 
        likesCount: result.post?._count?.likes || post._count.likes 
      };
    } catch (error) {
      // 失败时回滚
      dispatch(revertOptimisticUpdate({ postId, operationId }));
      throw error;
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {

    refreshPosts: (state) => {
      state.refreshCounter += 1;
    },
    clearError: (state) => {
      state.error = null;
    },
    /**
     * 乐观更新点赞状态
     */
    optimisticToggleLike: (state, action: PayloadAction<{ 
      postId: string; 
      hasLiked: boolean;
      operationId: string;
    }>) => {
      const { postId, hasLiked, operationId } = action.payload;
      const post = state.posts.find(p => p.id === postId);
      
      if (post) {
        post.hasLiked = hasLiked;
        post._count.likes += hasLiked ? 1 : -1;
        post.lastOperationId = operationId;
        post.isOptimistic = true;
      }
    },
    
    /**
     * 回滚乐观更新
     */
    revertOptimisticUpdate: (state, action: PayloadAction<{ 
      postId: string; 
      operationId: string;
    }>) => {
      const { postId, operationId } = action.payload;
      const post = state.posts.find(p => p.id === postId);
      
      if (post && post.lastOperationId === operationId) {
        post.hasLiked = !post.hasLiked;
        post._count.likes += post.hasLiked ? 1 : -1;
        post.isOptimistic = false;
        delete post.lastOperationId;
      }
    },
    

  },
  extraReducers: (builder) => {
    // 获取帖子列表
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        const { posts, pagination } = action.payload;
        
        if (pagination.page === 1) {
          // 第一页，替换所有数据（刷新场景）
          state.posts = posts;
        } else {
          // 后续页面，追加数据（无限滚动场景）
          state.posts.push(...posts);
        }
        
        state.pagination = pagination;
        state.error = null;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取帖子失败';
      });

    // 点赞/取消点赞
    builder
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, hasLiked, likesCount } = action.payload;
        const post = state.posts.find(p => p.id === postId);
        if (post) {
          post.hasLiked = hasLiked;
          post._count.likes = likesCount;
        }
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.error = action.error.message || '操作失败';
      });
  },
});

export const { 
  refreshPosts, 
  clearError,
  optimisticToggleLike,
  revertOptimisticUpdate,
} = postsSlice.actions;

export default postsSlice.reducer;
