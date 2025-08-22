/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  // 便于在 PM2/Docker 环境下以最小运行时启动
  output: 'standalone',

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
};

export default nextConfig;
