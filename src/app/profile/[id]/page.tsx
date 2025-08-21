import ClientProfile from "./ClientProfile";

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 获取用户信息的函数（仅用于 SEO）
async function getUserById(userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_ORIGIN
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');

  try {
    const res = await fetch(`${baseUrl}/api/users/${userId}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.success ? data.user : null;
  } catch (error) {
    console.error('Error fetching user for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const user = await getUserById(params.id);
  if (!user) {
    return {
      title: '用户不存在 | Social',
      description: '该用户不存在或已被删除。',
    };
  }

  return {
    title: `${user.name ?? user.username} | Social`,
    description: user.bio || `Check out ${user.username}'s profile.`,
    openGraph: {
      title: `${user.name ?? user.username}`,
      description: user.bio || `Check out ${user.username}'s profile.`,
      images: user.image ? [user.image] : [],
    },
  };
}

export default function ProfilePage() {
  // 直接使用客户端组件，让它处理所有逻辑
  return <ClientProfile />;
}
