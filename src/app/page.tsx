export const dynamic = 'force-dynamic';

import HomeClient from "./HomeClient";
import { apiClient } from "@/lib/api-client";

async function getInitialPosts() {
  try {
    const result = await apiClient.posts.getAll(1, 10) as any;
    
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
  const { posts, pagination } = await getInitialPosts();

  return (
    <HomeClient 
      initialPosts={posts} 
      initialPagination={pagination} 
    />
  );
}