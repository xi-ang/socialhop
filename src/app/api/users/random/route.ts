import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 获取随机用户推荐
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取3个随机用户，排除自己和已关注的用户
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: user.userId } },
          {
            NOT: {
              followers: {
                some: {
                  followerId: user.userId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: 3,
    });

    return NextResponse.json({
      success: true,
      users: randomUsers,
    });
  } catch (error) {
    console.error('Get random users error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
