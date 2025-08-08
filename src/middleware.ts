import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { generateCSPHeader } from '@/lib/security';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 创建响应对象，后续会添加安全头
  let response = NextResponse.next();

  // 公开路由，不需要认证
  const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/', '/api/posts', '/api/uploadthing'];
  
  // API 路由，需要认证
  const protectedApiRoutes = ['/api/users/me', '/api/notifications'];
  
  // 页面路由，需要认证
  const protectedPageRoutes = ['/profile', '/notifications'];

  // 如果是公开路由，直接通过
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    // 继续执行，但后面会添加安全头
  } else if (protectedApiRoutes.some(route => pathname.startsWith(route)) || 
             protectedPageRoutes.some(route => pathname.startsWith(route))) {
    // 对于受保护的路由，检查认证
    try {
      const user = getUserFromRequest(request);
      if (!user) {
        if (pathname.startsWith('/api/')) {
          response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        } else {
          // 重定向到登录页面
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('from', pathname);
          response = NextResponse.redirect(loginUrl);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (pathname.startsWith('/api/')) {
        response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      } else {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        response = NextResponse.redirect(loginUrl);
      }
    }
  }

  // 为所有响应添加安全头
  addSecurityHeaders(response);

  return response;
}

/**
 * 添加安全头到响应中
 */
function addSecurityHeaders(response: NextResponse) {
  // Content Security Policy - 防御XSS攻击
  response.headers.set('Content-Security-Policy', generateCSPHeader());
  
  // X-Frame-Options - 防御点击劫持
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options - 防御MIME类型嗅探攻击
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer-Policy - 控制Referer头信息泄露
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // X-XSS-Protection - 启用浏览器XSS过滤器（虽然已废弃，但向后兼容）
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Permissions-Policy - 控制浏览器功能权限
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api/.*)",
  ],
};
