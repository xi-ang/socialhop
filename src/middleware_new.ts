import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路由，不需要认证
  const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/', '/api/posts'];
  
  // API 路由，需要认证
  const protectedApiRoutes = ['/api/users/me', '/api/notifications'];
  
  // 页面路由，需要认证
  const protectedPageRoutes = ['/profile', '/notifications'];

  // 如果是公开路由，直接通过
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 对于受保护的路由，检查认证
  if (protectedApiRoutes.some(route => pathname.startsWith(route)) || 
      protectedPageRoutes.some(route => pathname.startsWith(route))) {
    
    try {
      const user = getUserFromRequest(request);
      if (!user) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        } else {
          // 重定向到登录页面
          const loginUrl = new URL('/auth/login', request.url);
          loginUrl.searchParams.set('from', pathname);
          return NextResponse.redirect(loginUrl);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      } else {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api/.*)",
  ],
};
