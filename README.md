# 🌟 现代化社交媒体平台

> 📖 **查看完整文档**: [文档索引](./文档索引.md) | [技术架构](./技术实现与架构文档.md) | [项目总结](./项目开发总结与技术回顾.md)

![Demo App](/public/screenshot-for-readme.png)

## ✨ 项目亮点

一个基于 Next.js 14 构建的全功能社交媒体平台，具备现代化的用户体验和完善的安全防护。

### 🚀 核心功能

- 📝 **内容发布**: 支持文本和多图片发布（最多9张）
- 💬 **实时交互**: 点赞、评论、关注系统  
- 🔔 **智能通知**: 实时通知推送，支持个性化设置
- 👤 **用户管理**: 完整的个人资料和头像管理
- � **安全认证**: JWT + bcryptjs 安全认证系统
- 🛡️ **XSS防护**: 全面的内容安全检查和过滤
- 📱 **响应式设计**: 适配桌面和移动设备

### 🆕 特色功能

- **@提及系统**: 
  - 实时用户搜索（防抖优化）
  - 键盘导航支持
  - @用户名高亮显示
  - 智能通知推送
  
- **多媒体支持**:
  - 拖拽上传图片
  - 实时预览和管理
  - 图片压缩和优化

- **性能优化**:
  - 乐观更新（点赞、评论）
  - 虚拟滚动（长列表）
  - 图片懒加载
  - ISR缓存策略

### 🛠 技术栈

**前端**:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + Shadcn/ui
- React Context (状态管理)
- React Hook Form + Zod

**后端**:
- Next.js API Routes
- Prisma (ORM)
- PostgreSQL (Neon)
- UploadThing (文件上传)

**安全与性能**:
- JWT认证 + bcryptjs
- XSS防护和内容过滤
- 防抖和缓存优化
- 图片优化和CDN

## � 快速开始

### 环境配置

创建 `.env` 文件：

```env
# 数据库
DATABASE_URL="postgresql://..."

# JWT密钥
JWT_SECRET="your-super-secret-jwt-key"

# 文件上传
UPLOADTHING_TOKEN="your-uploadthing-token"

# 应用URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 安装与运行

```bash
# 安装依赖
npm install

# 数据库设置
npx prisma generate
npx prisma db push

# 启动开发服务器
npm run dev
```

### 生产部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 📚 文档导航

- [📖 技术实现与架构文档](./技术实现与架构文档.md)
- [🔔 通知系统实现方案](./通知系统实现方案.md)
- [🔐 认证系统实现状态](./认证系统实现状态.md)
- [🧩 组件组织结构说明](./组件组织结构说明.md)

## 🎯 系统架构

```
📁 src/
├── 🎨 app/                  # App Router页面
│   ├── api/                # API路由
│   ├── auth/               # 认证页面
│   ├── profile/            # 个人资料
│   └── settings/           # 设置页面
├── 🧩 components/          # React组件
│   ├── common/             # 通用组件
│   ├── posts/              # 帖子相关
│   └── ui/                 # UI组件库
├── 🔧 lib/                 # 工具库
│   ├── auth.ts             # 认证工具
│   ├── security.ts         # 安全工具
│   └── prisma.ts           # 数据库连接
├── �️ actions/             # Server Actions
└── 🌐 contexts/            # React Context
```

## 🚀 主要特性详解

### @提及功能
- 输入`@`触发用户搜索
- 实时搜索建议（防抖300ms）
- 键盘导航（↑↓选择，Enter确认，Esc取消）
- 紫色高亮显示@用户名
- 智能通知（检查用户设置）

### 安全防护
- XSS攻击检测和防护
- 输入内容安全过滤
- JWT token安全存储
- CORS和CSP安全头

### 性能优化
- 乐观更新（UI先更新，后同步）
- 虚拟滚动（长列表性能）
- 图片懒加载和优化
- API请求缓存和防抖

## 🔧 开发指南

### 状态管理
当前使用React Context，轻量简洁。如需升级到Redux Toolkit，请参考[技术架构文档](./技术实现与架构文档.md)中的迁移方案。

### 组件开发
- 遵循函数式组件和Hooks
- 使用TypeScript确保类型安全
- 采用Tailwind CSS进行样式开发
- 利用Shadcn/ui组件库

### API设计
- RESTful API设计规范
- 统一的响应格式
- 完善的错误处理
- 请求参数验证

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

⭐ 如果这个项目对你有帮助，请给个star支持一下！