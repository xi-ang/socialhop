import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import FollowersPageClient from './FollowersPageClient';

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: username },
        { id: username } // 当传入的是ID时
      ]
    },
    select: { name: true, username: true }
  });

  if (!user) {
    return {
      title: '用户不存在',
    };
  }

  return {
    title: `${user.name || user.username} 的关注者和关注`,
    description: `查看 ${user.name || user.username} (@${user.username}) 的关注者和正在关注的用户。`,
  };
}

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function FollowersPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const { tab = 'followers' } = await searchParams;
  
  try {
    // 通过用户名或ID查找用户（兼容两种格式）
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { id: username } // 当传入的是ID时
        ]
      },
      select: { 
        id: true, 
        username: true, 
        name: true,
        image: true,
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      redirect('/');
    }

    // 获取关注者和关注的用户列表
    const [followers, following] = await Promise.all([
      prisma.follows.findMany({
        where: { followingId: user.id },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
              bio: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.follows.findMany({
        where: { followerId: user.id },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
              bio: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const followersData = followers.map(f => f.follower);
    const followingData = following.map(f => f.following);

    return (
      <FollowersPageClient
        user={user}
        followers={followersData}
        following={followingData}
        initialTab={tab as 'followers' | 'following'}
      />
    );
  } catch (error) {
    console.error('Error loading followers page:', error);
    redirect('/');
  }
}
