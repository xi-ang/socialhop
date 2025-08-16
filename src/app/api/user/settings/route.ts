import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 更新用户设置
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { name, bio, location, website, username } = data;

    // 如果更新用户名，检查是否已存在
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username,
          NOT: { id: user.userId }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "该用户名已被使用" },
          { status: 400 }
        );
      }
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        name,
        bio,
        location,
        website,
        username,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        image: true,
        location: true,
        website: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: '设置更新成功',
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    return NextResponse.json(
      { success: false, error: '更新设置失败' },
      { status: 500 }
    );
  }
}
