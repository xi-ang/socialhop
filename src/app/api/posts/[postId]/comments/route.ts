import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

// 添加评论
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const timestamp = new Date().toISOString();
  console.log(`\n💬 [${timestamp}] ===== COMMENT API CALLED =====`);
  console.log(`📍 PostId: ${params.postId}`);
  
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`👤 User authenticated: ${user.userId} (${user.username})`);

    const { postId } = params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    console.log(`📝 Creating comment with content: "${content}"`);
    
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

    console.log(`📝 Post found! Author: ${post.authorId}, Current user: ${user.userId}`);

    // 创建评论
    console.log(`💬 Creating comment...`);
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: user.userId,
        postId,
      },
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
    });
    console.log(`💬 ✅ Comment created successfully:`, comment.id);

    // 如果不是自己的帖子，创建通知
    if (post.authorId !== user.userId) {
      console.log(`\n🔔 === COMMENT NOTIFICATION PROCESS START ===`);
      console.log(`📝 Creating COMMENT notification:`);
      console.log(`   👤 From: ${user.userId} (${user.username})`);
      console.log(`   👤 To: ${post.authorId}`);
      console.log(`   📝 Post: ${postId}`);
      console.log(`   💬 Comment: ${comment.id}`);
      
      try {
        const result = await createNotification(
          "COMMENT",
          user.userId,
          post.authorId,
          postId,
          comment.id
        );
        console.log(`✅ COMMENT notification creation result:`, result ? 'SUCCESS' : 'FAILED/SKIPPED');
        console.log(`🔔 === COMMENT NOTIFICATION PROCESS END ===\n`);
      } catch (notificationError) {
        console.error(`❌ Error creating comment notification:`, notificationError);
        console.log(`🔔 === COMMENT NOTIFICATION PROCESS END (ERROR) ===\n`);
      }
    } else {
      console.log(`⚠️ Skipping notification: user commented on their own post`);
    }

    console.log(`✅ === COMMENT API COMPLETED ===\n`);
    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('❌ === COMMENT API ERROR ===');
    console.error('Create comment error:', error);
    console.error('❌ === COMMENT API ERROR END ===\n');
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
