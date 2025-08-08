"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";


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
          post: postId ? {
            select: {
              id: true,
              content: true,
              image: true,
            },
          } : false,
        },
      });

      console.log(`🔄 Updated existing notification: ${type} from ${creatorId} to ${recipientId}`);
      
      // 同样需要广播更新的通知
      try {
        const response = await fetch('http://localhost:8080/broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: recipientId,
            notification: {
              id: updated.id,
              type: updated.type,
              createdAt: updated.createdAt.toISOString(),
              read: updated.read,
              creator: updated.creator,
              post: updated.post,
              commentId: updated.commentId,
            }
          }),
        });

        if (response.ok) {
          console.log('📡 Updated notification broadcasted via WebSocket');
        } else {
          console.warn('⚠️ Failed to broadcast updated notification via WebSocket');
        }
      } catch (wsError) {
        console.warn('⚠️ WebSocket server not available for update broadcast:', wsError);
      }

      return updated;
    }

    // 创建新通知
    const notification = await prisma.notification.create({
      data: {
        type,
        creatorId,
        userId: recipientId, // 注意：数据库字段是userId
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
        post: postId ? {
          select: {
            id: true,
            content: true,
            image: true,
          },
        } : false,
      },
    });

    console.log(`📩 Notification created successfully:`, {
      id: notification.id,
      type: notification.type,
      creatorId: notification.creatorId,
      recipientId: recipientId,
      postId: notification.postId,
    });
    
    // 广播通知到WebSocket
    try {
      console.log(`📡 Attempting to broadcast notification to user ${recipientId}...`);
      const broadcastData = {
        userId: recipientId,
        notification: {
          id: notification.id,
          type: notification.type,
          createdAt: notification.createdAt.toISOString(),
          read: notification.read,
          creator: notification.creator,
          post: notification.post,
          commentId: notification.commentId,
        }
      };
      
      console.log(`📤 Broadcasting data:`, JSON.stringify(broadcastData, null, 2));
      
      const response = await fetch('http://localhost:8080/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(broadcastData),
      });

      if (response.ok) {
        const responseText = await response.text();
        console.log('📡 ✅ Notification broadcasted via WebSocket successfully:', responseText);
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Failed to broadcast notification via WebSocket:', response.status, errorText);
      }
    } catch (wsError) {
      console.warn('⚠️ WebSocket server not available:', wsError);
    }
    
    console.log(`✅ === CREATE NOTIFICATION SUCCESS ===\n`);
    return notification;
  } catch (error) {
    console.error("❌ === CREATE NOTIFICATION ERROR ===");
    console.error("❌ Error creating notification:", error);
    console.error("❌ === CREATE NOTIFICATION ERROR END ===\n");
    return null;
  }
}

export async function getNotifications() {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
}

export async function getUserNotifications(userId: string, limit: number = 20) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: userId },
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
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    return [];
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: userId,
        read: false,
      },
    });

    return count;
  } catch (error) {
    console.error("❌ Error counting unread notifications:", error);
    return 0;
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: userId, // 确保只能标记自己的通知
      },
      data: { read: true },
    });

    return notification;
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    return null;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: userId,
        read: false,
      },
      data: { read: true },
    });

    return true;
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    return false;
  }
}

export async function deleteNotification(notificationId: string, userId: string) {
  try {
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: userId, // 确保只能删除自己的通知
      },
    });

    return true;
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    return false;
  }
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  try {
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
      },
      data: {
        read: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return { success: false };
  }
}
