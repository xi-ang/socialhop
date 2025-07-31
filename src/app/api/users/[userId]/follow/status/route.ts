import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 获取关注状态
export async function GET(
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

    // 获取关注状态
    const isFollowing = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.userId,
          followingId: targetUserId,
        },
      },
    });

    // 获取关注统计
    const [followersCount, followingCount] = await Promise.all([
      prisma.follows.count({
        where: { followingId: targetUserId },
      }),
      prisma.follows.count({
        where: { followerId: targetUserId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        isFollowing: !!isFollowing,
        followersCount,
        followingCount,
      },
    });
  } catch (error) {
    console.error('Get follow status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get follow status' },
      { status: 500 }
    );
  }
}
