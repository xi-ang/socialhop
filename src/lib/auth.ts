import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { JwtService, JwtPayload } from './jwt';

/**
 * 从请求中获取 JWT token
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 从 cookie 获取 token
  const tokenCookie = request.cookies.get('auth-token');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

/**
 * 从请求中获取用户信息
 */

export function getUserFromRequest(request: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  return JwtService.verify(token);
}

/**
 * 从cookie中获取当前用户ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) return null;
    
    const payload = JwtService.verify(token);
    return payload?.userId || null;
  } catch (error) {
    return null;
  }
}

// export function createAuthResponse(token: string, message: string = 'Success') {
//   const response = new Response(JSON.stringify({ success: true, message }), {
//     status: 200,
//     headers: {
//       'Content-Type': 'application/json',
//       'Set-Cookie': `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`, // 7 days
//     },
//   });
  
//   return response;
// }
