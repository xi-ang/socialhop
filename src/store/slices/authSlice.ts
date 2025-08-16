import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient, User } from '@/lib/api-client';
import { TokenManager } from '@/lib/token-manager';

// 异步thunk - 登录
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await apiClient.auth.login(email, password) as any;
    if (response.success) {
      return response.user;
    }
    throw new Error('登录失败');
  }
);

// 异步thunk - 注册
export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, username, password, name }: { 
    email: string; 
    username: string; 
    password: string; 
    name?: string; 
  }) => {
    const response = await apiClient.auth.register(email, username, password, name) as any;
    if (response.success) {
      return response.user;
    }
    throw new Error('注册失败');
  }
);

// 异步thunk - 检查认证状态
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async () => {
    // 首先检查本地是否有 token
    if (!TokenManager.hasToken() || TokenManager.isTokenExpired()) {
      throw new Error('未登录或 token 已过期');
    }
    
    const response = await apiClient.users.getMe() as any;
    if (response.success) {
      return response.user;
    }
    throw new Error('未登录');
  }
);

// 异步thunk - 登出
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    await apiClient.auth.logout();
    // Token 已经在 apiClient.auth.logout() 中清除
  }
);

// 异步thunk - 用于应用启动时恢复认证状态
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    if (!TokenManager.hasToken() || TokenManager.isTokenExpired()) {
      throw new Error('无有效 token');
    }
    
    try {
      const response = await apiClient.users.getMe() as any;
      if (response.success) {
        return response.user;
      }
      throw new Error('获取用户信息失败');
    } catch (error) {
      // 如果获取用户信息失败，清除无效 token
      TokenManager.clearToken();
      throw error;
    }
  }
);

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    resetAuth: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    // 登录
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '登录失败';
        state.isAuthenticated = false;
      });

    // 注册
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '注册失败';
        state.isAuthenticated = false;
      });

    // 检查认证状态
    builder
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      });

    // 登出
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.error = '登出失败';
      });

    // 初始化认证状态
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { clearError, updateUser, resetAuth } = authSlice.actions;
export default authSlice.reducer;
