import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 获取帖子列表
export async function GET(request: NextRequest) {
  try {
    // 基于 offset/limit 的传统分页
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    console.log(`📄 Fetching posts: page=${page}, limit=${limit}, skip=${skip}`);

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        skip,         // 跳过前面的记录
        take: limit,  // 取指定数量的记录
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              username: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  image: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.post.count(),  // 获取总记录数
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    console.log(`📊 Posts fetched: ${posts.length}, total: ${totalCount}, pages: ${totalPages}, hasMore: ${hasMore}`);

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// 创建新帖子
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 检查 Content-Type 来决定如何解析请求体
    const contentType = request.headers.get('content-type') || '';
    
    let content, images: string[] = [];
    
    if (contentType.includes('multipart/form-data')) {
      // 处理 FormData
      const formData = await request.formData();
      content = formData.get('content') as string;
      const imageList = formData.getAll('images') as string[];
      images = imageList.filter(Boolean);
    } else {
      // 处理 JSON
      const body = await request.json();
      content = body.content;
      if (body.image) {
        images = [body.image];
      }
      if (body.images) {
        images = body.images;
      }
    }

    const post = await prisma.post.create({
      data: {
        content,
        image: images[0] || null, // 向后兼容
        images: images,
        authorId: user.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
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
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}