import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UsernamePage({ params }: PageProps) {
  const { username } = await params;
  
  try {
    // 通过用户名查找用户
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      // 如果用户不存在，重定向到404或首页
      redirect('/');
    }

    // 重定向到用户的profile页面
    redirect(`/profile/${user.id}`);
  } catch (error) {
    console.error('Error finding user by username:', error);
    redirect('/');
  }
}
