export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        posts: [],
        message: '请输入至少2个字符进行搜索'
      });
    }

    // 搜索包含关键词的帖子
    const posts = await prisma.post.findMany({
      where: {
        content: {
          contains: query.trim(),
          mode: 'insensitive', // 不区分大小写
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // 限制结果数量
    });

    return NextResponse.json({
      success: true,
      posts,
      query: query.trim(),
    });
  } catch (error) {
    console.error('Search posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search posts' },
      { status: 500 }
    );
  }
}
