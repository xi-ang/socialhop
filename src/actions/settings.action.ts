"use server";

import { getDbUserId } from "./user.action";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) {
      return { success: false, error: "未授权" };
    }

    // 获取用户当前密码
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      return { success: false, error: "用户不存在" };
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return { success: false, error: "当前密码不正确" };
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return { success: true, message: "密码修改成功" };
  } catch (error) {
    console.error("修改密码失败:", error);
    return { success: false, error: "修改密码失败" };
  }
}

export async function deleteAccount() {
  try {
    const userId = await getDbUserId();
    if (!userId) {
      return { success: false, error: "未授权" };
    }

    // 删除用户账户（由于外键约束，相关数据会级联删除）
    await prisma.user.delete({
      where: { id: userId }
    });

    return { success: true, message: "账号已注销" };
  } catch (error) {
    console.error("注销账号失败:", error);
    return { success: false, error: "注销账号失败" };
  }
}

export async function updateUserSettings(data: {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
}) {
  try {
    const userId = await getDbUserId();
    if (!userId) {
      return { success: false, error: "未授权" };
    }

    // 如果更新用户名，检查是否已存在
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return { success: false, error: "该用户名已被使用" };
      }
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    revalidatePath("/settings");
    revalidatePath("/profile");
    
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("更新设置失败:", error);
    return { success: false, error: "更新设置失败" };
  }
}
