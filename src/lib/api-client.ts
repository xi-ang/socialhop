// API 客户端工具类-所有 HTTP 请求的统一封装器，封装了底层的 fetch 逻辑，提供结构化的 API 接口
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include', // 重要：包含cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // 认证相关
  auth = {
    login: (email: string, password: string) =>
      this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    
    register: (email: string, username: string, password: string, name?: string) =>
      this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, username, password, name }),
      }),
    
    logout: () =>
      this.request('/auth/logout', {
        method: 'POST',
      }),
  };

  // 用户相关
  users = {
    getMe: () => this.request('/users/me'),
    
    updateMe: (data: { name?: string; bio?: string; location?: string; website?: string }) =>
      this.request('/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    getRandomUsers: () => this.request('/users/random'),
    
    getByUsername: (username: string) => this.request(`/users/${username}`),
    
    toggleFollow: (userId: string) =>
      this.request(`/users/${userId}/follow`, {
        method: 'POST',
      }),
  };

  // 帖子相关
  posts = {
    getAll: () => this.request('/posts'),
    
    create: (content: string, image?: string) =>
      this.request('/posts', {
        method: 'POST',
        body: JSON.stringify({ content, image }),
      }),
    
    delete: (postId: string) =>
      this.request(`/posts/${postId}`, {
        method: 'DELETE',
      }),
    
    toggleLike: (postId: string) =>
      this.request(`/posts/${postId}/like`, {
        method: 'POST',
      }),
    
    addComment: (postId: string, content: string) =>
      this.request(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    
    getUserPosts: (userId: string) => this.request(`/posts/user/${userId}`),
    
    getUserLikedPosts: (userId: string) => this.request(`/posts/user/${userId}/liked`),
  };

  // 通知相关
  notifications = {
    getAll: () => this.request('/notifications'),
    
    markAsRead: (notificationIds: string[]) =>
      this.request('/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ notificationIds }),
      }),
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
