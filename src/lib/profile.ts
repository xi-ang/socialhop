import prisma from "@/lib/prisma";

// 获取用户的帖子
export async function getUserPosts(userId: string) {
  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  return posts;
}

// 获取用户点赞的帖子
export async function getUserLikedPosts(userId: string) {
  const likedPosts = await prisma.post.findMany({
    where: {
      likes: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  return likedPosts;
}

// 获取用户评论过的帖子
export async function getUserCommentedPosts(userId: string) {
  const commentedPosts = await prisma.post.findMany({
    where: {
      comments: {
        some: {
          authorId: userId,
        },
      },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  return commentedPosts;
}

// 检查是否关注某用户
export async function isFollowing(currentUserId: string, targetUserId: string) {
  if (!currentUserId) return false;
  
  const follow = await prisma.follows.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    },
  });

  return !!follow;
}
