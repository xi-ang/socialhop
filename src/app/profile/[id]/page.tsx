import {
  getProfileById,
} from "@/actions/profile.action";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { id: string } }) {
  const user = await getProfileById(params.id);
  if (!user) return;

  return {
    title: `${user.name ?? user.username}`,
    description: user.bio || `Check out ${user.username}'s profile.`,
  };
}

async function ProfilePageServer({ params }: { params: { id: string } }) {
  const user = await getProfileById(params.id);

  if (!user) notFound();

  // 获取环境变量或默认值
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';

  // 使用fetch获取数据，添加时间戳防止缓存
  const timestamp = Date.now();
  const res = await fetch(`${baseUrl}/api/profile?userId=${user.id}&t=${timestamp}`, {
    cache: 'no-store', // 禁用缓存
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to load profile');
  }

  const { posts, likedPosts, commentedPosts, isCurrentUserFollowing } = await res.json();

  return (
    <ProfilePageClient
      user={user}
      posts={posts || []}
      likedPosts={likedPosts || []}
      commentedPosts={commentedPosts || []}
      isCurrentUserFollowing={isCurrentUserFollowing}
    />
  );
}

export default ProfilePageServer;
