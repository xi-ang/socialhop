import prisma from "@/lib/prisma";

// 通过外部 WebSocket 服务器广播通知
// 注意：广播失败不影响主流程（通知已成功写库），此处仅做日志告警
async function broadcastViaWebSocket(userId: string, notification: any) {
  try {
    const port = process.env.WEBSOCKET_PORT || 8080;
    const baseUrl = process.env.WEBSOCKET_URL || (process.env.NODE_ENV === 'production' ? '' : `http://localhost:${port}`);
    const url = `${baseUrl}/broadcast`;

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, notification }),
    });
  } catch (error) {
    console.warn('⚠️ WebSocket broadcast failed (notification will still be stored):', error);
  }
}

// 检查用户通知设置
async function checkUserNotificationSettings(
  userId: string, 
  notificationType: 'LIKE' | 'COMMENT' | 'FOLLOW'
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    }) as any;

    if (!user) {
      console.log(`⚠️ User ${userId} not found, defaulting to enabled`);
      return true;
    }

    const settings = user.notificationSettings || {
      likes: true,
      comments: true,
      follows: true,
    };

    const settingKey = notificationType.toLowerCase() + 's'; // LIKE -> likes, COMMENT -> comments, FOLLOW -> follows
    const isEnabled = settings[settingKey] !== false; // 默认启用

    console.log(`🔧 User ${userId} ${notificationType} notifications: ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
    return isEnabled;
  } catch (error) {
    console.error('Error checking notification settings:', error);
    // 出错时默认允许通知
    return true;
  }
}

export async function createNotification(
  type: 'LIKE' | 'COMMENT' | 'FOLLOW',
  creatorId: string,
  recipientId: string,
  postId?: string,
  commentId?: string
) {
  const timestamp = new Date().toISOString();
  console.log(`\n🔔 [${timestamp}] === CREATE NOTIFICATION START ===`);
  console.log(`📋 Type: ${type}`);
  console.log(`👤 From: ${creatorId}`);
  console.log(`👤 To: ${recipientId}`);
  console.log(`📝 PostId: ${postId || 'none'}`);
  console.log(`💬 CommentId: ${commentId || 'none'}`);
  
  try {
    // 避免自己给自己发通知
    if (creatorId === recipientId) {
      console.log(`⚠️ Skipping self-notification: ${creatorId} === ${recipientId}`);
      console.log(`🔔 === CREATE NOTIFICATION END (SELF) ===\n`);
      return null;
    }

    // 检查用户的通知设置
    const notificationSettings = await checkUserNotificationSettings(recipientId, type);
    if (!notificationSettings) {
      console.log(`⚠️ User ${recipientId} has disabled ${type} notifications`);
      console.log(`🔔 === CREATE NOTIFICATION END (DISABLED) ===\n`);
      return null;
    }

    console.log(`🔄 Processing notification: ${type} from ${creatorId} to ${recipientId}`);

    // 检查是否已存在相同通知（避免重复）
    const existingNotification = await prisma.notification.findFirst({
      where: {
        type,
        creatorId,
        userId: recipientId, // 注意：数据库字段是userId，不是recipientId
        postId: postId || null,
        commentId: commentId || null,
      },
    });

    if (existingNotification) {
      // 更新时间戳并重新设置为未读状态
      const updated = await prisma.notification.update({
        where: { id: existingNotification.id },
        data: { 
          createdAt: new Date(),
          read: false // 重新标记为未读，让用户知道有新活动
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
              createdAt: true,
            },
          },
        },
      });
      
      console.log(`✅ Updated existing notification: ${updated.id}`);
      // 广播到 WebSocket（客户端收到后会主动拉取未读数量）
      await broadcastViaWebSocket(recipientId, updated);
      console.log(`🔔 === CREATE NOTIFICATION END (UPDATED) ===\n`);
      return updated;
    }

    // 创建新通知
    const notification = await prisma.notification.create({
      data: {
        type,
        creatorId,
        userId: recipientId, // 数据库字段是userId
        postId: postId || null,
        commentId: commentId || null,
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
            createdAt: true,
          },
        },
      },
    });
    
    console.log(`✅ Created notification: ${notification.id}`);
    // 广播到 WebSocket（客户端收到后会主动拉取未读数量）
    await broadcastViaWebSocket(recipientId, notification);
    console.log(`🔔 === CREATE NOTIFICATION END (SUCCESS) ===\n`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    console.log(`🔔 === CREATE NOTIFICATION END (ERROR) ===\n`);
    return null;
  }
}
