// XSS防护配置
// const purifyConfig = {
//   ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
//   ALLOWED_ATTR: ['href', 'target', 'rel'],
//   ALLOW_DATA_ATTR: false,
//   FORBID_SCRIPT: true,
//   FORBID_TAGS: ['script', 'object', 'embed', 'style', 'link'],
//   FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
// };

/**
 * 净化用户输入内容，防止XSS攻击
 * 整合了字符过滤、HTML转义和长度限制
 */
export function sanitizeInput(input: string, maxLength: number = 280): string {
  if (!input) return '';
  
  // 第一步：长度限制和基础清理
  let cleaned = input
    .slice(0, maxLength)
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 移除控制字符
    .replace(/javascript:/gi, '') // 移除javascript:协议
    .replace(/data:/gi, '') // 移除data:协议
    .replace(/vbscript:/gi, ''); // 移除vbscript:协议
  
  // 第二步：HTML实体转义
  const escaped = cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return escaped;
}


/**
 * 验证用户输入是否包含潜在的XSS攻击
 */
export function detectXSS(content: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(content));
}

/**
 * 生成内容安全策略头
 */
export function generateCSPHeader(): string {
  const isDev = process.env.NODE_ENV === 'development';
  
  return [
    "default-src 'self'",                    // 默认只允许同源资源
    // 开发环境需要允许内联脚本和eval，生产环境更严格
    isDev 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'", // Next.js需要unsafe-inline
    "style-src 'self' 'unsafe-inline'",     // 允许内联样式（Tailwind CSS需要）
    "img-src 'self' data: https: blob: https://*.uploadthing.com https://utfs.io", // 允许同源、data URI、HTTPS图片、blob和UploadThing CDN
    "font-src 'self' data:",                // 允许同源和data URI字体
    "connect-src 'self' ws: wss: https://*.ingest.uploadthing.com https://api.uploadthing.com", // 允许同源请求、WebSocket连接和UploadThing服务
    "media-src 'self'",                     // 允许同源媒体文件
    // 在开发环境中允许 data: 协议的对象源，以支持浏览器扩展和开发工具
    isDev ? "object-src 'self' data:" : "object-src 'none'", // 开发环境允许data URI对象，生产环境禁止
    "frame-ancestors 'none'",               // 禁止被其他站点嵌入
    "frame-src 'none'",                     // 禁止嵌入框架
    "base-uri 'self'",                      // 防止base标签劫持
    "form-action 'self'",                   // 限制表单提交目标
    ...(isDev ? [] : ["upgrade-insecure-requests"]), // 生产环境才升级HTTP到HTTPS
  ].join('; ');
}

/**
 * 渲染带有@mention高亮的内容
 * @param content - 原始内容
 * @returns 处理后的内容数组，包含文本和高亮的mention元素
 */
export function renderMentions(content: string): Array<{ type: 'text' | 'mention', content: string, username?: string }> {
  if (!content) return [{ type: 'text', content: '' }];
  
  const mentionRegex = /@(\w+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    // 添加mention之前的文本
    if (match.index > lastIndex) {
      parts.push({
        type: 'text' as const,
        content: content.slice(lastIndex, match.index)
      });
    }
    
    // 添加mention
    parts.push({
      type: 'mention' as const,
      content: match[0], // 完整的@username
      username: match[1] // 只是username部分
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // 添加剩余的文本
  if (lastIndex < content.length) {
    parts.push({
      type: 'text' as const,
      content: content.slice(lastIndex)
    });
  }
  
  return parts;
}
