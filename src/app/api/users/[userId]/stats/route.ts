import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // 获取用户统计数据
    const [followersCount, followingCount, postsCount] = await Promise.all([
      prisma.follows.count({
        where: { followingId: userId },
      }),
      prisma.follows.count({
        where: { followerId: userId },
      }),
      prisma.post.count({
        where: { authorId: userId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        followersCount,
        followingCount,
        postsCount,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user stats' },
      { status: 500 }
    );
  }
}
