"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { JwtService } from '@/lib/jwt';
import { createNotification } from '@/actions/notification.action';

// 从cookie中获取当前用户ID
async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) return null;
    
    const payload = JwtService.verify(token);
    return payload?.userId || null;
  } catch (error) {
    return null;
  }
}

// 获取当前用户的数据库ID（兼容旧函数）
export async function getDbUserId() {
  return getCurrentUserId();
}

// 根据用户ID获取用户（替代getUserByClerkId）
export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
}

// 兼容旧的getUserByClerkId函数
export async function getUserByClerkId(userId: string) {
  return getUserById(userId);
}

// 同步用户函数（现在不需要了，但保留兼容性）
export async function syncUser() {
  // JWT认证系统中不需要同步，用户在注册时就创建了
  return null;
}

export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();
    
    // 如果用户未登录，返回空数组
    if (!userId) return [];

    const users = await prisma.user.findMany({
      where: {
        NOT: {
          id: userId, // 排除当前用户
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        username: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  } catch (error) {
    console.log("Error in getRandomUsers", error);
    return [];
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error("Unauthorized");

    // 检查是否已经关注
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // 取消关注
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      // 添加关注
      await prisma.follows.create({
        data: {
          followerId: userId,
          followingId: targetUserId,
        },
      });

      // 创建通知
      await createNotification(
        "FOLLOW",
        userId,
        targetUserId
      );
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Error in toggleFollow", error);
    throw new Error("Failed to toggle follow");
  }
}
