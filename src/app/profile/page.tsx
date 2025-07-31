import { redirect } from 'next/navigation';
import { getDbUserId } from '@/actions/user.action';
import prisma from '@/lib/prisma';

export default async function ProfilePage() {
  const userId = await getDbUserId();
  
  if (!userId) {
    redirect('/auth/login');
  }

  // 获取当前用户信息
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true }
  });

  if (user?.username) {
    redirect(`/profile/${user.id}`);
  }

  // 如果没有用户名，重定向到编辑资料页面
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">完善您的资料</h1>
        <p className="text-muted-foreground mb-4">
          请先设置您的用户名以访问您的个人资料页面。
        </p>
        <a href="/settings" className="text-primary hover:underline">
          前往设置
        </a>
      </div>
    </div>
  );
}
