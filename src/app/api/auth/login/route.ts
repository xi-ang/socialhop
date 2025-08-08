import { NextRequest, NextResponse } from 'next/server';
import { JwtService } from '@/lib/jwt';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        image: true,
        password: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 401 }
      );
    }

    // 验证密码
    const isValidPassword = await JwtService.comparePassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: '密码错误' },
        { status: 401 }
      );
    }

    // 创建 JWT token
    const token = JwtService.sign({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;

    // 设置 cookie 并返回响应 - NextResponse.json()默认返回一个 200 OK 的状态码，因此响应成功不显示设置status
    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      user: userWithoutPassword,
      token,
    });

    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 改为 lax，更宽松的同站策略
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
