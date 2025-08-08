# 🔧 WebSocket 身份验证问题解决方案

## � 紧急修复：API 路径错误

**问题：** `POST http://localhost:3000/api/login 404 (Not Found)`

**原因：** API 客户端中的登录路径错误
- API 客户端请求：`/login` 
- 实际路由位置：`/auth/login`

**✅ 已修复：** 更正了 `src/lib/api-client.ts` 中的登录路径

## �🔍 原始问题分析

错误信息显示：
```
[WS] 🤝 WebSocket handshake - checking credentials...
[WS] 🍪 Available cookies: []
[WS] ❌ WebSocket connection rejected: No auth-token cookie
```

这表明：
1. **WebSocket 连接时没有 cookies**
2. **缺少 auth-token cookie**
3. **用户可能未登录或 cookie 配置有问题**

## 🛠️ 解决步骤

### 步骤 1: 检查用户登录状态

请在浏览器中：
1. 打开开发者工具 (F12)
2. 进入 Application/Storage 标签页
3. 查看 Cookies 部分
4. 检查是否存在 `auth-token` cookie

### 步骤 2: 如果没有 auth-token cookie

**原因可能是：**
- 用户未登录
- Cookie 被清除
- 登录时出现错误

**解决方案：**
1. 重新登录应用
2. 检查登录是否成功
3. 确认 cookie 被正确设置

### 步骤 3: 检查 Cookie 配置

当前的 cookie 配置：
```typescript
response.cookies.set({
  name: 'auth-token',
  value: token,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // 开发环境下为 false
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60, // 7 days
});
```

### 步骤 4: 临时调试方案

如果问题持续，可以临时修改 cookie 配置使其更宽松：

```typescript
// 在 src/app/api/auth/login/route.ts 中
response.cookies.set({
  name: 'auth-token',
  value: token,
  httpOnly: false, // 临时改为 false 便于调试
  secure: false,   // 临时改为 false
  sameSite: 'lax', // 临时改为 lax
  maxAge: 7 * 24 * 60 * 60,
});
```

## 🔄 快速修复建议

### 方案 A: 重新登录
1. 清除浏览器缓存和 cookies
2. 重新登录应用
3. 检查 WebSocket 连接是否正常

### 方案 B: 检查开发环境
确保您在开发环境中运行，cookie 的 `secure` 设置应该为 `false`

### 方案 C: 修改 WebSocket 连接逻辑
在 WebSocket 连接前添加登录状态检查：

```typescript
// 在 useNotificationWebSocket.ts 中
const connect = () => {
  if (!user?.id) {
    console.log('⚠️ WebSocket connection skipped: No user ID');
    return;
  }
  
  // 检查是否有 auth-token cookie
  const cookies = document.cookie;
  if (!cookies.includes('auth-token')) {
    console.log('⚠️ WebSocket connection skipped: No auth-token cookie');
    return;
  }
  
  // 继续连接逻辑...
};
```

## 🎯 推荐操作

**立即执行：**
1. 检查浏览器中是否有 `auth-token` cookie
2. 如果没有，请重新登录
3. 如果有 cookie 但仍然报错，检查 cookie 的属性设置

**如果问题持续：**
1. 清除所有浏览器数据
2. 重启开发服务器
3. 重新登录并测试

这个问题与我们刚才的组件替换无关，是身份验证系统的配置问题。
