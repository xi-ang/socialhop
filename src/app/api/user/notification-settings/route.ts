import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 获取用户通知设置
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
    }) as any;

    if (!userRecord) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const settings = userRecord.notificationSettings || {
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notification settings' },
      { status: 500 }
    );
  }
}

// 更新用户通知设置
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { settings } = await request.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    // 验证设置格式
    const validSettings = {
      likes: Boolean(settings.likes),
      comments: Boolean(settings.comments),
      follows: Boolean(settings.follows),
      mentions: Boolean(settings.mentions),
    };

    await prisma.user.update({
      where: { id: user.userId },
      data: { notificationSettings: validSettings } as any,
    });

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated',
      settings: validSettings,
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
