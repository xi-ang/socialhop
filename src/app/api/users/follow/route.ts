import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

// 关注/取消关注用户
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    if (user.userId === targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // 检查是否已经关注
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // 取消关注
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: user.userId,
            followingId: targetUserId,
          },
        },
      });

      return NextResponse.json({
        success: true,
        action: 'unfollowed',
        message: 'Successfully unfollowed user'
      });
    } else {
      // 添加关注
      await prisma.follows.create({
        data: {
          followerId: user.userId,
          followingId: targetUserId,
        },
      });

      // 创建通知
      await createNotification(
        "FOLLOW",
        user.userId,
        targetUserId
      );

      return NextResponse.json({
        success: true,
        action: 'followed',
        message: 'Successfully followed user'
      });
    }
  } catch (error) {
    console.error('Toggle follow error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle follow' },
      { status: 500 }
    );
  }
}
