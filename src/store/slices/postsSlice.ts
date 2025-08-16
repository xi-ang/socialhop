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

// 异步thunk - 点赞/取消点赞
export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async ({ postId }: { postId: string }) => {
    const result = await apiClient.posts.toggleLike(postId) as any;
    return { postId, hasLiked: result.hasLiked, likesCount: result.likesCount };
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    addPost: (state, action: PayloadAction<Post>) => {
      state.posts.unshift(action.payload);
    },
    removePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter(post => post.id !== action.payload);
    },
    updatePost: (state, action: PayloadAction<{ id: string; updates: Partial<Post> }>) => {
      const { id, updates } = action.payload;
      const index = state.posts.findIndex(post => post.id === id);
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...updates };
      }
    },
    refreshPosts: (state) => {
      state.refreshCounter += 1;
    },
    clearError: (state) => {
      state.error = null;
    },
    // 乐观更新点赞状态
    optimisticToggleLike: (state, action: PayloadAction<{ postId: string; hasLiked: boolean }>) => {
      const { postId, hasLiked } = action.payload;
      const post = state.posts.find(p => p.id === postId);
      if (post) {
        post.hasLiked = hasLiked;
        post._count.likes += hasLiked ? 1 : -1;
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
  addPost, 
  removePost, 
  updatePost, 
  refreshPosts, 
  clearError,
  optimisticToggleLike,
} = postsSlice.actions;

export default postsSlice.reducer;
