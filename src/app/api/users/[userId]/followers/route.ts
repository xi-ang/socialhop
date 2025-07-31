import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取用户的关注者列表
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 获取关注者列表
    const followers = await prisma.follows.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
            _count: {
              select: {
                followers: true,
                following: true,
                posts: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // 获取总数
    const total = await prisma.follows.count({
      where: { followingId: userId },
    });

    const users = followers.map(f => f.follower);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get followers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get followers' },
      { status: 500 }
    );
  }
}
