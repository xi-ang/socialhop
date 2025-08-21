// 🚀 API 客户端工具类 - 统一HTTP请求管理器
// 功能特性：
// 1. 🎯 统一接口封装：所有API请求的统一入口，避免重复的fetch逻辑
// 2. 💾 智能缓存系统：基于业务场景的分层缓存策略，提升应用性能
// 3. 🏷️ 标签化缓存：支持按标签批量清除缓存，确保数据一致性
// 4. 🔄 多种缓存模式：cache-first(缓存优先) | network-first(网络优先) | cache-only(仅缓存) | network-only(仅网络)
// 5. 🔐 自动认证处理：自动添加JWT token到请求头
// 6. 🌐 环境适配：支持SSR和CSR，自动处理URL差异
// 7. 📊 Next.js集成：支持Next.js的revalidate缓存机制

// 🎛️ 缓存配置接口
interface CacheConfig {
  ttl?: number;           // 缓存时间(秒) - 内存缓存的存活时间
  revalidate?: number;    // Next.js revalidate 时间(秒) - SSR缓存重新验证间隔
  tags?: string[];        // 缓存标签 - 用于批量清除相关缓存
  mode?: 'cache-first' | 'network-first' | 'cache-only' | 'network-only'; // 缓存策略模式
}

// 🔧 API请求选项接口 - 扩展RequestInit但排除Next.js的cache属性避免冲突
interface ApiRequestOptions extends Omit<RequestInit, 'cache'> {
  cacheConfig?: CacheConfig; // 自定义缓存配置
}

// 🏗️ API客户端主类 - 核心请求管理器
class ApiClient {
  private baseUrl: string;
  private memoryCache: Map<string, { data: any; expires: number; tags: string[] }>;

  constructor(baseUrl?: string) {
    // 在服务器端，需要完整的URL
    if (typeof window === 'undefined') {
      // 生产环境优先读取 NEXT_PUBLIC_APP_ORIGIN 或 VERCEL_URL，避免写死 localhost
      const origin = process.env.NEXT_PUBLIC_APP_ORIGIN
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
        || (process.env.HOST ? `https://${process.env.HOST}` : 'http://localhost:3000');
      this.baseUrl = baseUrl || `${origin}/api`;
    } else {
      // 在客户端，可以使用相对路径
      this.baseUrl = baseUrl || '/api';
    }
    this.memoryCache = new Map();
  }

  // 获取存储在 localStorage 中的 token
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth-token');
  }

  // 设置 token 到 localStorage
  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
    }
  }

  // 清除 token
  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
    }
  }

  // 缓存管理方法
  private getCacheKey(endpoint: string, options?: ApiRequestOptions): string {
    const queryParams = new URLSearchParams();
    if (options?.body && typeof options.body === 'string') {
      try {
        const bodyObj = JSON.parse(options.body);
        Object.keys(bodyObj).forEach(key => {
          queryParams.append(key, bodyObj[key]);
        });
      } catch {}
    }
    return `${endpoint}?${queryParams.toString()}`;
  }

  private getFromCache(cacheKey: string): any | null {
    const cached = this.memoryCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    if (cached) {
      this.memoryCache.delete(cacheKey);
    }
    return null;
  }

  private setToCache(cacheKey: string, data: any, ttl: number = 300, tags: string[] = []): void {
    this.memoryCache.set(cacheKey, {
      data,
      expires: Date.now() + (ttl * 1000),
      tags
    });
  }

  private invalidateByTags(tags: string[]): void {
    const entries = Array.from(this.memoryCache.entries());
    for (const [key, cached] of entries) {
      if (cached.tags.some((tag: string) => tags.includes(tag))) {
        this.memoryCache.delete(key);
      }
    }
  }

  // 获取不同类型请求的默认缓存配置
  // 根据业务需求和数据更新频率，设计分层缓存策略
  private getDefaultCacheConfig(endpoint: string, method: string = 'GET'): CacheConfig {
    // 写操作不缓存 - POST/PUT/DELETE等修改数据的操作总是请求服务器
    if (method !== 'GET') {
      return { mode: 'network-only' };
    }

    // 根据端点类型设置不同的缓存策略
    
    // 🏠 公共帖子列表 - 中等频率缓存（60秒）
    // 理由：帖子内容相对稳定，但需要及时显示新发布的内容
    // 适用：/api/posts, /api/posts/following, /api/posts/search
    if (endpoint.includes('/posts') && !endpoint.includes('/user/')) {
      return { ttl: 60, revalidate: 60, tags: ['posts'], mode: 'cache-first' };
    }
    
    // 📊 用户统计信息 - 短期缓存（30秒）
    // 理由：关注数、粉丝数等统计可能频繁变化，需要较快更新
    // 适用：/api/users/{id}/stats - 显示用户关注数、粉丝数、帖子数
    if (endpoint.includes('/users/') && endpoint.includes('/stats')) {
      return { ttl: 30, revalidate: 30, tags: ['user-stats'], mode: 'cache-first' };
    }
    
    // 👤 当前登录用户信息 - 中期缓存（5分钟）
    // 理由：用户自己的基本信息变化频率较低，可以缓存较长时间
    // 适用：/api/users/me - 获取当前用户的个人信息
    if (endpoint.includes('/users/me')) {
      return { ttl: 300, revalidate: 300, tags: ['current-user'], mode: 'cache-first' };
    }
    
    // 🔍 其他用户基本信息 - 长期缓存（10分钟）
    // 理由：其他用户的基本信息（头像、昵称、简介等）变化频率很低
    // 适用：/api/users/{id}, /api/users/by-username/{username}
    if (endpoint.includes('/users/') && !endpoint.includes('/follow')) {
      return { ttl: 600, revalidate: 600, tags: ['users'], mode: 'cache-first' };
    }
    
    // 🔔 未读通知计数 - 超短期缓存（10秒）+ 网络优先
    // 理由：通知计数实时性要求最高，用户期望立即看到新通知
    // 模式：网络优先，确保数据新鲜度，缓存仅作为网络失败时的备选
    if (endpoint.includes('/notifications/unread-count')) {
      return { ttl: 10, revalidate: 10, tags: ['notifications'], mode: 'network-first' };
    }
    
    // 📬 通知列表 - 短期缓存（30秒）
    // 理由：通知列表内容可能较多，适度缓存减少加载时间，但仍需保持相对新鲜
    // 适用：/api/notifications - 获取用户的通知列表
    if (endpoint.includes('/notifications')) {
      return { ttl: 30, revalidate: 30, tags: ['notifications'], mode: 'cache-first' };
    }

    // 🌐 默认策略 - 网络优先，短期缓存
    // 理由：对于未明确分类的API，优先保证数据新鲜度
    // 兜底缓存60秒，防止频繁请求相同数据
    return { mode: 'network-first', ttl: 60 };
  }

  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();
    const method = options.method || 'GET';
    
    // 合并缓存配置
    const cacheConfig = {
      ...this.getDefaultCacheConfig(endpoint, method),
      ...options.cacheConfig
    };
    
    const cacheKey = this.getCacheKey(endpoint, options);
    
    // 缓存策略处理
    if (method === 'GET' && cacheConfig.mode !== 'network-only') {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        if (cacheConfig.mode === 'cache-first' || cacheConfig.mode === 'cache-only') {
          return cached;
        }
      }
      if (cacheConfig.mode === 'cache-only') {
        throw new Error('No cached data available');
      }
    }
    
    // 处理 FormData 的特殊情况
    const isFormData = options.body instanceof FormData;
    
    // 构建 fetch 配置
    const fetchConfig: RequestInit = {
      credentials: 'include',
      method,
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // 添加 Next.js 缓存配置
    if (cacheConfig.revalidate) {
      fetchConfig.next = { revalidate: cacheConfig.revalidate };
    }

    const response = await fetch(url, fetchConfig);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    const data = await response.json();
    
    // 缓存 GET 请求的响应
    if (method === 'GET' && cacheConfig.ttl && cacheConfig.mode !== 'network-only') {
      this.setToCache(cacheKey, data, cacheConfig.ttl, cacheConfig.tags || []);
    }
    
    // 写操作后清除相关缓存
    if (method !== 'GET') {
      if (endpoint.includes('/posts')) {
        this.invalidateByTags(['posts', 'user-stats']);
      }
      if (endpoint.includes('/users') || endpoint.includes('/follow')) {
        this.invalidateByTags(['users', 'user-stats', 'current-user']);
      }
      if (endpoint.includes('/notifications')) {
        this.invalidateByTags(['notifications']);
      }
    }

    return data;
  }

  // 🔐 认证相关 API
  auth = {
    // 🔓 用户登录 - 登录页面
    // 无缓存：登录是状态改变操作，需要实时验证和处理
    // 自动处理：成功后将token存储到localStorage
    login: async (email: string, password: string) => {
      const response = await this.request<{ success: boolean; user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // 将 token 存储到 localStorage
      if (response.success && response.token) {
        this.setToken(response.token);
      }
      
      return response;
    },
    
    // 📝 用户注册 - 注册页面
    // 无缓存：注册是创建新用户的操作，需要实时处理
    // 自动处理：成功后将token存储到localStorage，实现注册即登录
    register: async (email: string, username: string, password: string, name?: string) => {
      const response = await this.request<{ success: boolean; user: any; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, username, password, name }),
      });
      
      // 将 token 存储到 localStorage
      if (response.success && response.token) {
        this.setToken(response.token);
      }
      
      return response;
    },
    
    // 🚪 用户登出 - 退出登录
    // 无缓存：登出是状态清除操作，需要立即处理
    // 安全处理：无论服务器响应如何，都会清除本地token
    logout: async () => {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
        });
      } finally {
        // 无论 API 调用是否成功，都清除本地 token
        this.clearToken();
      }
    },
  };

  // 👥 用户相关 API
  users = {
    // 👤 获取当前登录用户信息 - 个人资料
    // 缓存策略：5分钟中期缓存，个人信息变化频率较低
    getMe: () => 
      this.request('/users/me', {
        cacheConfig: { ttl: 300, revalidate: 300, tags: ['current-user'], mode: 'cache-first' }
      }),
    
    // 🔍 根据ID获取用户信息 - 用户详情页
    // 缓存策略：10分钟长期缓存，其他用户基本信息很少变化
    getById: (userId: string) => 
      this.request(`/users/${userId}`, {
        cacheConfig: { ttl: 600, revalidate: 600, tags: ['users'], mode: 'cache-first' }
      }),
    
    // 📊 获取用户统计信息 - 关注数、粉丝数等
    // 缓存策略：30秒短期缓存，统计数据可能频繁变化
    getStats: (userId: string) =>
      this.request(`/users/${userId}/stats`, {
        cacheConfig: { ttl: 30, revalidate: 30, tags: ['user-stats'], mode: 'cache-first' }
      }),
    
    // ✏️ 更新当前用户信息 - 编辑个人资料
    // 无缓存：个人信息更新，需要立即生效
    updateMe: (data: { name?: string; bio?: string; location?: string; website?: string }) =>
      this.request('/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // 🎲 获取随机推荐用户 - 推荐关注
    // 缓存策略：2分钟缓存，推荐列表可以短期缓存，避免频繁计算
    getRandomUsers: () => 
      this.request('/users/random', {
        cacheConfig: { ttl: 120, revalidate: 120, tags: ['users'], mode: 'cache-first' }
      }),
    
    // 🔍 根据用户名获取用户 - 用户名访问
    // 缓存策略：10分钟长期缓存，用户名到用户的映射很少变化
    getByUsername: (username: string) => 
      this.request(`/users/by-username/${username}`, {
        cacheConfig: { ttl: 600, revalidate: 600, tags: ['users'], mode: 'cache-first' }
      }),
    
    // 🔍 搜索用户 - @提及和搜索功能
    // 缓存策略：5分钟缓存，搜索结果相对稳定
    searchUsers: (query: string, limit: number = 5) => 
      this.request(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        cacheConfig: { ttl: 300, revalidate: 300, tags: ['users', 'search'], mode: 'cache-first' }
      }),
    
    // 👥 切换关注状态 - 关注/取关按钮
    // 无缓存：关注操作需要立即响应和生效
    toggleFollow: (userId: string) =>
      this.request(`/users/${userId}/follow`, {
        method: 'POST',
      }),
    
    // 👥 关注用户（用于替代 Server Action）
    // 无缓存：关注操作需要立即生效
    followUser: (targetUserId: string) =>
      this.request('/users/follow', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      }),
    
    // 🔍 获取关注状态 - 检查是否已关注某用户
    // 默认缓存：关注状态查询，使用网络优先保证准确性
    getFollowStatus: (userId: string) =>
      this.request(`/users/${userId}/follow/status`),
    
    // 👥 获取粉丝列表 - 用户的关注者
    // 缓存策略：2分钟缓存，关注关系变化相对较慢
    getFollowers: (userId: string) =>
      this.request(`/users/${userId}/followers`, {
        cacheConfig: { ttl: 120, revalidate: 120, tags: ['users'], mode: 'cache-first' }
      }),
    
    // 👥 获取关注列表 - 用户关注的人
    // 缓存策略：2分钟缓存，关注关系变化相对较慢
    getFollowing: (userId: string) =>
      this.request(`/users/${userId}/following`, {
        cacheConfig: { ttl: 120, revalidate: 120, tags: ['users'], mode: 'cache-first' }
      }),
    
    // 🔒 账户安全相关
    // 🔑 修改密码 - 安全设置
    // 无缓存：密码修改是敏感操作，需要立即处理
    changePassword: (currentPassword: string, newPassword: string) =>
      this.request('/user/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    
    // 🗑️ 删除账户 - 危险操作
    // 无缓存：账户删除是不可逆操作，需要立即处理
    deleteAccount: () =>
      this.request('/user/delete', {
        method: 'DELETE',
      }),
    
    // ⚙️ 更新用户设置 - 个人设置页面
    // 无缓存：设置更新需要立即生效
    updateSettings: (data: {
      name?: string;
      bio?: string;
      location?: string;
      website?: string;
      username?: string;
    }) =>
      this.request('/user/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // 🔔 通知设置相关
    // 📋 获取通知设置 - 通知偏好设置页面
    // 缓存策略：5分钟长期缓存，通知设置变化频率很低
    getNotificationSettings: () =>
      this.request('/user/notification-settings', {
        cacheConfig: { ttl: 300, revalidate: 300, tags: ['notification-settings'], mode: 'cache-first' }
      }),
    
    updateNotificationSettings: (settings: any) =>
      this.request('/user/notification-settings', {
        method: 'POST',
        body: JSON.stringify({ settings }),
      }),
  };

  // 📝 帖子相关 API
  posts = {
    // 🏠 获取所有公共帖子 - 首页帖子流
    // 缓存策略：60秒缓存，适合首页展示，平衡新鲜度和性能
    getAll: (page: number = 1, limit: number = 10) => 
      this.request(`/posts?page=${page}&limit=${limit}`, {
        // 使用网络优先，缩短缓存时间，避免跨设备写入后首页长时间读取到旧缓存
        cacheConfig: { ttl: 15, revalidate: 15, tags: ['posts'], mode: 'network-first' }
      }),
    
    // 👥 获取关注用户的帖子 - 个性化内容
    // 缓存策略：30秒短期缓存，更频繁更新以显示关注用户的最新动态
    getFollowing: (page: number = 1, limit: number = 10) =>
      this.request(`/posts/following?page=${page}&limit=${limit}`, {
        cacheConfig: { ttl: 30, revalidate: 30, tags: ['posts', 'following'], mode: 'cache-first' }
      }),
    
    // 🔍 搜索帖子 - 关键词搜索
    // 缓存策略：5分钟长期缓存，搜索结果相对稳定，可以较长时间缓存
    search: (query: string, page: number = 1, limit: number = 10) =>
      this.request(`/posts/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
        cacheConfig: { ttl: 300, revalidate: 300, tags: ['posts', 'search'], mode: 'cache-first' }
      }),
    
    // 📄 获取单个帖子详情 - 帖子详情页
    // 缓存策略：5分钟缓存，帖子内容发布后相对稳定
    getById: (postId: string) => 
      this.request(`/posts/${postId}`, {
        cacheConfig: { ttl: 300, revalidate: 300, tags: ['posts'], mode: 'cache-first' }
      }),
    
    // ✍️ 创建新帖子 - 发布内容
    // 无缓存：写操作，直接请求服务器
    create: (content: string, image?: string) =>
      this.request('/posts', {
        method: 'POST',
        body: JSON.stringify({ content, image }),
      }),
    
    // 📎 支持 FormData 的创建方法（用于替代 Server Action）
    // 无缓存：文件上传等写操作，直接请求服务器
    createWithFormData: (formData: FormData) =>
      this.request('/posts', {
        method: 'POST',
        body: formData,
      }),
    
    // 🗑️ 删除帖子
    // 无缓存：删除操作，直接请求服务器
    delete: (postId: string) =>
      this.request(`/posts/${postId}`, {
        method: 'DELETE',
      }),
    
    // ❤️ 点赞/取消点赞 - 互动操作
    // 无缓存：高频互动操作，需要实时响应
    toggleLike: (postId: string) =>
      this.request(`/posts/${postId}/like`, {
        method: 'POST',
      }),
    
    // 💬 添加评论 - 互动操作
    // 无缓存：评论是新内容，需要立即提交
    addComment: (postId: string, content: string) =>
      this.request(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    
    // 💬 获取评论列表 - 读取操作
    // 默认缓存：评论相对稳定，使用默认的网络优先策略
    getComments: (postId: string) =>
      this.request(`/posts/${postId}/comments`),
    
    // 👤 获取用户的帖子列表 - 个人主页
    // 默认缓存：个人帖子列表，使用默认缓存策略
    getUserPosts: (userId: string) => this.request(`/posts/user/${userId}`),
    
    // ❤️ 获取用户点赞的帖子 - 个人喜欢页面  
    // 默认缓存：点赞列表相对稳定
    getUserLikedPosts: (userId: string) => this.request(`/posts/user/${userId}/liked`),
  };

  // 🔔 通知相关 API
  notifications = {
    // 📋 获取所有通知 - 通知中心
    // 缓存策略：30秒短期缓存，通知内容需要相对及时的更新
    getAll: () => 
      this.request('/notifications', {
        cacheConfig: { ttl: 30, revalidate: 30, tags: ['notifications'], mode: 'cache-first' }
      }),
    
    // 🔢 获取未读通知数量 - 导航栏红点提示
    // 缓存策略：10秒超短期缓存 + 网络优先，确保未读数的实时性
    getUnreadCount: () => 
      this.request('/notifications/unread-count', {
        cacheConfig: { ttl: 10, revalidate: 10, tags: ['notifications'], mode: 'network-first' }
      }),
    
    // ✅ 标记通知为已读 - 单个通知
    // 无缓存：状态更新操作，需要立即生效
    markAsRead: (notificationId: string) =>
      this.request(`/notifications/${notificationId}`, {
        method: 'PATCH',
      }),
    
    // ✅ 标记所有通知为已读 - 批量操作
    // 无缓存：批量状态更新，需要立即生效
    markAllAsRead: () =>
      this.request('/notifications', {
        method: 'PATCH',
      }),
    
    // 🗑️ 删除通知
    // 无缓存：删除操作，需要立即生效
    delete: (notificationId: string) =>
      this.request(`/notifications/${notificationId}`, {
        method: 'DELETE',
      }),
    
    // ⚙️ 获取通知设置 - 设置页面
    // 缓存策略：5分钟长期缓存，设置项变化频率很低
    getSettings: () => 
      this.request('/notifications/settings', {
        cacheConfig: { ttl: 300, revalidate: 300, tags: ['notification-settings'], mode: 'cache-first' }
      }),
    
    // ⚙️ 更新通知设置
    // 无缓存：设置更新操作，需要立即生效
    updateSettings: (settings: any) =>
      this.request('/notifications/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
  };

  // 个人资料相关
  profile = {
    getProfile: (userId: string) => this.request(`/profile?userId=${userId}`),
    
    update: (formData: FormData) =>
      this.request('/profile/update', {
        method: 'PUT',
        body: formData,
        // 不需要手动设置 headers，request 方法会自动处理 FormData 和 token
      }),
    
    updateAvatar: (imageUrl: string) =>
      this.request('/profile/update', {
        method: 'PATCH',
        body: JSON.stringify({ imageUrl }),
      }),
  };

  // 文件上传相关
  upload = {
    uploadFile: (file: FormData) =>
      this.request('/upload', {
        method: 'POST',
        body: file,
        // 不需要手动设置 headers，request 方法会自动处理 FormData 和 token
      }),
    
    // UploadThing 上传 - 云端存储
    uploadToCloud: (files: File[]) => {
      // 这个方法将由前端组件直接调用 UploadThing 客户端
      // 不需要经过我们的 API 中间层
      throw new Error('请直接使用 UploadThing 客户端上传');
    },
  };
}

// 导出单例实例
export const apiClient = new ApiClient();

// 导出类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  bio: string | null;
  image: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
  _count?: {
    followers: number;
    following: number;
    posts: number;
  };
}

export interface Post {
  id: string;
  content: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  comments: Comment[];
  likes: { userId: string }[];
  _count: {
    likes: number;
    comments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  postId: string;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
}

export interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW';
  read: boolean;
  createdAt: string;
  userId: string;
  creatorId: string;
  postId?: string | null;
  commentId?: string | null;
  creator: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  post?: {
    id: string;
    content: string | null;
    image: string | null;
  } | null;
  comment?: {
    id: string;
    content: string;
    createdAt: string;
  } | null;
}
