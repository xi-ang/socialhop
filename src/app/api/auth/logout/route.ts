import { NextRequest, NextResponse } from 'next/server';

// 清除认证cookie
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: '登出成功'
    });

    // 清除认证cookie
    response.cookies.set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // 立即过期
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: '登出失败，请稍后重试' },
      { status: 500 }
    );
  }
}
