/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🌐 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        pathname: '/**',
      },
    ],
    // 图片缓存配置
    minimumCacheTTL: 31536000, // 1年缓存
  },
  
  // 🚀 性能优化
  experimental: {
    optimizeCss: true,
  },
  
  // 📦 压缩配置
  compress: true,
  
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
};

export default nextConfig;
