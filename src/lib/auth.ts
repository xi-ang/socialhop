import { NextRequest } from 'next/server';
import { JwtService, JwtPayload } from './jwt';

export function getTokenFromRequest(request: NextRequest): string | null {
  // 从 Authorization header 获取 token
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

export function getUserFromRequest(request: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  return JwtService.verify(token);
}

export function createAuthResponse(token: string, message: string = 'Success') {
  const response = new Response(JSON.stringify({ success: true, message }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`, // 7 days
    },
  });
  
  return response;
}
