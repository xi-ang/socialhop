import { NextRequest } from 'next/server';
import { JwtService, JwtPayload } from './jwt';

/** 
 * 从 Authorization header 获取 JWT token
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
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



