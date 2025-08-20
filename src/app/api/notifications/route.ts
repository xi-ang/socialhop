import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 获取通知列表
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 获取通知列表
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            image: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // 兜底修复：如果某些通知没有携带帖子预览内容，但存在 postId，则批量补齐帖子内容
    const missingPostIds = notifications
      .filter(n => !n.post && n.postId)
      .map(n => n.postId as string);
    let postMap: Record<string, { id: string; content: string | null; image: string | null }> = {};
    if (missingPostIds.length > 0) {
      const posts = await prisma.post.findMany({
        where: { id: { in: missingPostIds } },
        select: { id: true, content: true, image: true }
      });
      postMap = posts.reduce((acc, p) => { acc[p.id] = p as any; return acc; }, {} as any);
    }

    const normalizedNotifications = notifications.map(n => {
      let withPost = n as any;
      if (!withPost.post && withPost.postId && postMap[withPost.postId]) {
        withPost = { ...withPost, post: postMap[withPost.postId] };
      }
      // 内容兜底：若帖子内容为空且存在评论内容或图片，提供预览文本
      if (withPost.post) {
        const contentIsEmpty = withPost.post.content == null || withPost.post.content === '';
        if (contentIsEmpty) {
          if (withPost.type === 'COMMENT' && withPost.comment?.content) {
            withPost = { ...withPost, post: { ...withPost.post, content: withPost.comment.content } };
          } else if (withPost.post.image) {
            withPost = { ...withPost, post: { ...withPost.post, content: '[图片]' } };
          }
        }
      }
      return withPost;
    });

    // 获取总数
    const total = await prisma.notification.count({
      where: {
        userId: user.userId,
      },
    });

    return NextResponse.json({
      success: true,
      notifications: normalizedNotifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

// 标记所有通知为已读
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 标记所有通知为已读
    await prisma.notification.updateMany({
      where: {
        userId: user.userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    // 广播未读数刷新
    try {
      const port = process.env.WEBSOCKET_PORT || 8080;
      const baseUrl = process.env.WEBSOCKET_URL || `http://localhost:${port}`;
      await fetch(`${baseUrl}/broadcast-unread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId })
      });
    } catch (wsError) {
      console.warn('⚠️ Failed to broadcast unread count after mark-all-read:', wsError);
    }

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
