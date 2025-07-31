import { getUserFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
      },
      cookies: request.headers.get('cookie') || 'No cookies',
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error getting user info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
