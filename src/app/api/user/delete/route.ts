import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 删除账户
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 删除用户相关的所有数据
    await prisma.$transaction(async (tx) => {
      // 删除用户的评论
      await tx.comment.deleteMany({
        where: { authorId: user.userId },
      });

      // 删除用户的点赞
      await tx.like.deleteMany({
        where: { userId: user.userId },
      });

      // 删除用户的关注关系
      await tx.follows.deleteMany({
        where: {
          OR: [
            { followerId: user.userId },
            { followingId: user.userId },
          ],
        },
      });

      // 删除用户的通知
      await tx.notification.deleteMany({
        where: {
          OR: [
            { creatorId: user.userId },
            { userId: user.userId },
          ],
        },
      });

      // 删除用户的帖子
      await tx.post.deleteMany({
        where: { authorId: user.userId },
      });

      // 最后删除用户
      await tx.user.delete({
        where: { id: user.userId },
      });
    });

    return NextResponse.json({
      success: true,
      message: '账户已成功删除',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { success: false, error: '删除账户失败' },
      { status: 500 }
    );
  }
}
