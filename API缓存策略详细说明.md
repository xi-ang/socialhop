# 🚀 API客户端缓存策略详细说明

## 📋 概述

本项目的API客户端(`src/lib/api-client.ts`)实现了智能的分层缓存系统，根据不同数据类型的业务特性，采用差异化的缓存策略，在保证数据新鲜度的同时最大化性能优化。

## 🎯 缓存策略设计原则

### 1. 业务导向的缓存时间
- **实时性要求高**：通知计数等关键指标，采用超短期缓存(10秒)
- **中等更新频率**：帖子内容、用户统计，采用短中期缓存(30-60秒)  
- **低频变化数据**：用户基本信息、设置项，采用长期缓存(5-10分钟)

### 2. 标签化缓存管理
- **posts**: 帖子相关数据
- **users**: 用户基本信息  
- **user-stats**: 用户统计数据
- **current-user**: 当前登录用户信息
- **notifications**: 通知相关数据
- **notification-settings**: 通知设置
- **following**: 关注关系数据
- **search**: 搜索结果

### 3. 多种缓存模式
- **cache-first**: 缓存优先，适合相对稳定的数据
- **network-first**: 网络优先，确保数据新鲜度
- **cache-only**: 仅使用缓存，离线模式
- **network-only**: 仅网络请求，写操作等

## 📊 详细缓存策略表

| API类别 | 端点示例 | TTL | 模式 | 标签 | 业务说明 |
|---------|----------|-----|------|------|----------|
| **🔐 认证相关** | `/auth/login` | - | network-only | - | 登录/注册/登出，状态变更操作 |
| **👤 当前用户** | `/users/me` | 300s | cache-first | current-user | 个人信息变化频率低 |
| **🔍 其他用户** | `/users/{id}` | 600s | cache-first | users | 他人基本信息很少变化 |
| **📊 用户统计** | `/users/{id}/stats` | 30s | cache-first | user-stats | 关注数等可能频繁变化 |
| **🎲 推荐用户** | `/users/random` | 120s | cache-first | users | 推荐列表可短期缓存 |
| **🔍 用户搜索** | `/users/search` | 300s | cache-first | users,search | 搜索结果相对稳定 |
| **👥 关注关系** | `/users/{id}/followers` | 120s | cache-first | users | 关注关系变化较慢 |
| **🏠 公共帖子** | `/posts` | 60s | cache-first | posts | 平衡新鲜度和性能 |
| **👥 关注帖子** | `/posts/following` | 30s | cache-first | posts,following | 个性化内容更频繁更新 |
| **🔍 搜索帖子** | `/posts/search` | 300s | cache-first | posts,search | 搜索结果可较长缓存 |
| **📄 帖子详情** | `/posts/{id}` | 300s | cache-first | posts | 单个帖子内容相对稳定 |
| **💬 帖子评论** | `/posts/{id}/comments` | 60s | network-first | - | 评论需要较新鲜度 |
| **🔔 通知列表** | `/notifications` | 30s | cache-first | notifications | 通知需要相对及时更新 |
| **🔢 未读计数** | `/notifications/unread-count` | 10s | network-first | notifications | 实时性要求最高 |
| **⚙️ 通知设置** | `/notifications/settings` | 300s | cache-first | notification-settings | 设置变化频率很低 |

## 🔄 缓存失效策略

### 自动失效机制
```typescript
// 写操作后自动清除相关缓存
if (method !== 'GET') {
  if (endpoint.includes('/posts')) {
    this.invalidateByTags(['posts', 'user-stats']);  // 发帖影响统计
  }
  if (endpoint.includes('/users') || endpoint.includes('/follow')) {
    this.invalidateByTags(['users', 'user-stats', 'current-user']); // 用户操作
  }
  if (endpoint.includes('/notifications')) {
    this.invalidateByTags(['notifications']); // 通知操作
  }
}
```

### 标签化批量清除
- **发布帖子**: 清除 `posts` + `user-stats`
- **关注操作**: 清除 `users` + `user-stats` + `current-user`  
- **通知操作**: 清除 `notifications`

## 🚀 性能优化特性

### 1. 内存缓存
```typescript
private memoryCache: Map<string, { 
  data: any; 
  expires: number; 
  tags: string[] 
}>;
```

### 2. Next.js集成
```typescript
// 添加 Next.js 缓存配置
if (cacheConfig.revalidate) {
  fetchConfig.next = { revalidate: cacheConfig.revalidate };
}
```

### 3. 智能缓存键
```typescript
private getCacheKey(endpoint: string, options?: ApiRequestOptions): string {
  // 包含查询参数的完整缓存键
}
```

## ⚡ 使用示例

### 基本使用
```typescript
// 自动应用缓存策略
const posts = await apiClient.posts.getAll();
const user = await apiClient.users.getById(userId);
```

### 自定义缓存
```typescript
// 覆盖默认缓存配置
const posts = await apiClient.posts.getAll(1, 10, {
  cacheConfig: { ttl: 120, mode: 'network-first' }
});
```

### 缓存管理
```typescript
// 手动清除特定标签的缓存
apiClient.invalidateByTags(['posts']);
```

## 📈 监控与调试

### 缓存命中统计
可以在开发工具中观察到：
- 缓存命中：快速响应(通常<10ms)
- 网络请求：较慢响应(几百到几千ms)

### 缓存生命周期
每个缓存项包含：
- `data`: 缓存的响应数据
- `expires`: 过期时间戳  
- `tags`: 关联的标签列表

## 🎯 最佳实践

1. **读多写少的数据**: 使用较长TTL + cache-first
2. **实时性要求高**: 使用短TTL + network-first  
3. **写操作**: 使用network-only，并清除相关缓存
4. **搜索结果**: 可以使用较长TTL，减少重复搜索开销
5. **用户交互**: 关注、点赞等操作立即更新，确保用户体验

## 🔧 配置调优

根据实际使用情况，可以调整：
- **TTL值**: 根据数据更新频率微调
- **缓存模式**: 在性能和新鲜度间平衡
- **标签策略**: 优化缓存失效的颗粒度

这套缓存策略显著提升了应用性能，同时保证了数据的准确性和用户体验的流畅性。
