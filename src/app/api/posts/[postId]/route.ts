import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 点赞/取消点赞帖子
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = params;

    // 检查是否已经点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.userId,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      // 取消点赞
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: user.userId,
            postId: postId,
          },
        },
      });
    } else {
      // 添加点赞
      await prisma.like.create({
        data: {
          userId: user.userId,
          postId: postId,
        },
      });
    }

    // 重新验证相关路径
    revalidatePath('/');
    revalidatePath(`/profile/${user.userId}`);

    return NextResponse.json({
      success: true,
      liked: !existingLike,
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}

// 添加评论
export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: user.userId,
        postId: postId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // 重新验证相关路径
    revalidatePath('/');
    revalidatePath(`/profile/${user.userId}`);

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

// 删除帖子
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.authorId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - no delete permission' },
        { status: 403 }
      );
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

// 获取单个帖子详情
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const user = getUserFromRequest(request);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
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
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: '帖子不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post,
      dbUserId: user?.userId || null,
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { success: false, error: '获取帖子失败' },
      { status: 500 }
    );
  }
}
