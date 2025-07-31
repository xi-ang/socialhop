import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createNotification } from '@/actions/notification.action';

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

    // 检查点赞是否存在
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.userId,
          postId,
        },
      },
    });

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

    if (existingLike) {
      console.log(`👎 Removing existing like...`);
      // 取消点赞
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: user.userId,
            postId,
          },
        },
      });
      console.log(`👎 ✅ Like removed successfully`);
    } else {
      console.log(`👍 Creating new like...`);
      // 点赞
      await prisma.like.create({
        data: {
          userId: user.userId,
          postId,
        },
      });
      console.log(`👍 ✅ Like created successfully`);

      // 创建通知（如果不是自己的帖子）
      if (post.authorId !== user.userId) {
        console.log(`\n� === NOTIFICATION PROCESS START ===`);
        console.log(`�📝 Creating LIKE notification:`);
        console.log(`   👤 From: ${user.userId} (${user.username})`);
        console.log(`   👤 To: ${post.authorId}`);
        console.log(`   📝 Post: ${postId}`);
        
        try {
          const result = await createNotification(
            "LIKE",
            user.userId,
            post.authorId,
            postId
          );
          console.log(`✅ LIKE notification creation result:`, result ? 'SUCCESS' : 'FAILED/SKIPPED');
          console.log(`🔔 === NOTIFICATION PROCESS END ===\n`);
        } catch (notificationError) {
          console.error(`❌ Error creating notification:`, notificationError);
          console.log(`🔔 === NOTIFICATION PROCESS END (ERROR) ===\n`);
        }
      } else {
        console.log(`⚠️ Skipping notification: user liked their own post`);
      }
    }

    console.log(`✅ === LIKE API COMPLETED ===\n`);
    return NextResponse.json({
      success: true,
      liked: !existingLike,
    });
  } catch (error) {
    console.error('❌ === LIKE API ERROR ===');
    console.error('Toggle like error:', error);
    console.error('❌ === LIKE API ERROR END ===\n');
    return NextResponse.json(
      { success: false, error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
