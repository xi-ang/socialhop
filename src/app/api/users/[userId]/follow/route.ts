import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createNotification } from '@/actions/notification.action';

// 关注用户
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId: targetUserId } = params;

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
      return NextResponse.json(
        { success: false, error: 'Already following this user' },
        { status: 400 }
      );
    }

    // 创建关注关系
    await prisma.follows.create({
      data: {
        followerId: user.userId,
        followingId: targetUserId,
      },
    });

    // 创建关注通知
    try {
      await createNotification(
        'FOLLOW',
        user.userId,
        targetUserId
      );
    } catch (notificationError) {
      console.error('Failed to create follow notification:', notificationError);
      // 不影响关注操作
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully followed user',
    });
  } catch (error) {
    console.error('Follow user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

// 取消关注
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId: targetUserId } = params;

    // 删除关注关系
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
      message: 'Successfully unfollowed user',
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}
