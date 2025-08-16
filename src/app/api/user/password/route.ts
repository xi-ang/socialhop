import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// 修改密码
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: '当前密码和新密码不能为空' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: '新密码至少需要6个字符' },
        { status: 400 }
      );
    }

    // 获取用户当前密码
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { password: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: '当前密码错误' },
        { status: 400 }
      );
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await prisma.user.update({
      where: { id: user.userId },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: '密码修改失败' },
      { status: 500 }
    );
  }
}
