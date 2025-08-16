import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import prisma from '@/lib/prisma';

async function broadcastNotification(userId: string, notification: any, creator: any) {
  try {
    const response = await fetch('http://localhost:8080/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        notification: {
          id: notification.id,
          type: notification.type,
          createdAt: notification.createdAt.toISOString(),
          read: notification.read,
          creator: creator,
          post: null,
          commentId: null,
        }
      }),
    });

    if (response.ok) {
      console.log('📡 Test notification broadcasted via WebSocket');
    } else {
      console.warn('⚠️ Failed to broadcast test notification');
    }
  } catch (wsError) {
    console.warn('⚠️ WebSocket server not available:', wsError);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📝 Creating test notification for user:', user.userId);

    // 简化版本：直接使用createNotification，创建自己给自己的通知用于测试
    // 临时修改createNotification的检查逻辑
    const testUserId = 'test-user-' + Math.random().toString(36).substr(2, 9);
    
    const notification = await createNotification(
      "LIKE",
      testUserId,      // 虚拟创建者
      user.userId,     // 当前用户接收
      undefined        // 无帖子
    );

    if (notification) {
      console.log('✅ Test notification created via createNotification');
    } else {
      console.log('⚠️ Notification creation was skipped (probably self-notification check)');
      
      // 如果被跳过，直接创建数据库记录用于测试
      const directNotification = await prisma.notification.create({
        data: {
          type: "LIKE",
          userId: user.userId,
          creatorId: user.userId, // 暂时使用自己的ID
          read: false,
        }
      });
      
      // 手动触发WebSocket广播
      await broadcastNotification(user.userId, directNotification, {
        id: user.userId,
        username: user.username || 'test',
        name: '测试用户',
        image: null
      });
    }

    console.log('✅ Test notification process completed');

    return NextResponse.json({
      success: true,
      message: 'Test notification created'
    });
  } catch (error) {
    console.error('❌ Failed to create test notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create test notification' },
      { status: 500 }
    );
  }
}
