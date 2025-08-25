/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,  // 启用严格模式
  swcMinify: true,  // 启用 SWC 压缩
  compress: true,  // 启用 gzip 压缩
  productionBrowserSourceMaps: false,  // 关闭浏览器端 source map
  output: 'standalone',  // 便于在 PM2/Docker 环境下以最小运行时启动

  // 注意：不要在这里暴露敏感环境变量到客户端
  // 只有 NEXT_PUBLIC_ 开头的环境变量才会被客户端访问

  // 🔧 生产环境移除 console（保留 warn/error）
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // 🌐 图片优化配置（UploadThing/utfs.io）
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uploadthing.com', pathname: '/**' },
      { protocol: 'https', hostname: 'utfs.io', pathname: '/**' },
    ],
    minimumCacheTTL: 31536000, // 1年缓存
  },

  // 为浏览器端打包做最小 polyfill 处理
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // 为静态资源与 Next 产物设置长缓存
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // 跳过类型检查，加快构建速度
  typescript: {
    ignoreBuildErrors: true,
  },

  // 跳过 ESLint 检查，加快构建速度
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 强制使用 HTTP 协议
  assetPrefix: 'http://8.138.115.181',

  // 禁用静态生成，改为服务端渲染（解决 Clerk 问题）
  // experimental: {
  //   appDir: true,  // 这个选项在 Next.js 13+ 中已经默认启用，不需要显式设置
  // },
};

export default nextConfig;
