import { getDbUserId } from "@/actions/user.action";
import HomeClient from "./HomeClient";

async function getInitialPosts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/posts?page=1&limit=10`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch posts:', response.status, response.statusText);
      throw new Error('Failed to fetch posts');
    }
    
    const result = await response.json();
    
    if (result.success) {
      return {
        posts: result.data.posts,
        pagination: result.data.pagination,
      };
    }
    
    return {
      posts: [],
      pagination: {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
        hasMore: false,
      },
    };
  } catch (error) {
    console.error('Error fetching initial posts:', error);
    // 如果获取失败，返回空数据
    return {
      posts: [],
      pagination: {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
        hasMore: false,
      },
    };
  }
}

export default async function Home() {
  const dbUserId = await getDbUserId();
  const { posts, pagination } = await getInitialPosts();

  return (
    <HomeClient 
      initialPosts={posts} 
      initialPagination={pagination} 
      dbUserId={dbUserId} 
    />
  );
}