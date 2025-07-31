import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getDbUserId } from '@/actions/user.action';
import PostDetailClient from './PostDetailClient';

async function getPost(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
        },
      },
      likes: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  return post;
}

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: { postId: string };
  searchParams: { tab?: string };
}) {
  const post = await getPost(params.postId);
  const dbUserId = await getDbUserId();

  if (!post) {
    notFound();
  }

  return (
    <PostDetailClient 
      post={post} 
      dbUserId={dbUserId} 
      defaultTab={searchParams.tab || 'comments'}
    />
  );
}
