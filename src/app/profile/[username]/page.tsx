import {
  getProfileByUsername,
  // getUserLikedPosts,
  // getUserPosts,
  // isFollowing,
} from "@/actions/profile.action";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";

export async function generateMetadata({ params }: { params: { username: string } }) {
  const user = await getProfileByUsername(params.username);
  if (!user) return;

  return {
    title: `${user.name ?? user.username}`,
    description: user.bio || `Check out ${user.username}'s profile.`,
  };
}

async function ProfilePageServer({ params }: { params: { username: string } }) {
  const user = await getProfileByUsername(params.username);

  if (!user) notFound();

  // const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
  //   getUserPosts(user.id),
  //   getUserLikedPosts(user.id),
  //   isFollowing(user.id),
  // ]);

  // 调用 Route Handler

  //在 Next.js 的服务端组件中，fetch 的 URL 需要是 绝对路径（包含完整的 http:// 或 https://），或者通过 process.env.NEXT_PUBLIC_BASE_URL 动态获取。
  const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/profile?userId=${user.id}`);
  const data = await res.json();

  if (!res.ok) {
    // 处理错误（例如显示错误页面）
    throw new Error(data.error || 'Failed to load profile');
  }

  // 解构返回的数据
  const { posts, likedPosts, isCurrentUserFollowing } = data;

  return (
    <ProfilePageClient
      user={user}
      posts={posts}
      likedPosts={likedPosts}
      isFollowing={isCurrentUserFollowing}
    />
  );
}
export default ProfilePageServer;
