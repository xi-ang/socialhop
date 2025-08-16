import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 更新个人资料
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const username = formData.get("username") as string;
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const website = formData.get("website") as string;

    // 验证用户名格式
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { success: false, error: "用户名只能包含字母、数字和下划线" },
        { status: 400 }
      );
    }

    // 检查用户名是否已被其他用户使用
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      
      if (existingUser && existingUser.id !== user.userId) {
        return NextResponse.json(
          { success: false, error: "该用户名已被使用" },
          { status: 400 }
        );
      }
    }

    // 更新用户资料
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        username,
        name,
        bio,
        location,
        website,
        updatedAt: new Date(),
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
      message: "个人资料更新成功",
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: '更新个人资料失败' },
      { status: 500 }
    );
  }
}

// 更新头像
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: '头像URL不能为空' },
        { status: 400 }
      );
    }

    // 更新用户头像
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        image: imageUrl,
        updatedAt: new Date(),
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
      message: "头像更新成功",
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    return NextResponse.json(
      { success: false, error: '头像更新失败' },
      { status: 500 }
    );
  }
}
