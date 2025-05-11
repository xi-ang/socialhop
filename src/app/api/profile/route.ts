import { NextResponse } from 'next/server';
import {
    getUserLikedPosts,
    getUserPosts,
    isFollowing,
} from "@/actions/profile.action";

// 关键配置：启用 Edge Runtime 和缓存策略
export const runtime = 'edge';
export const maxDuration = 30; // 边缘函数超时时间（秒）

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId'); // 从查询参数获取 userId

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId parameter' },
                { status: 400, headers: { 'Cache-Control': 'no-store' } }  //禁止缓存错误响应
            );
        }

        // 并行获取所有数据
        const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
            getUserPosts(userId),
            getUserLikedPosts(userId),
            isFollowing(userId),
        ]);

        // 返回统一格式的 JSON
        return NextResponse.json({
            posts,
            likedPosts,
            isCurrentUserFollowing,
        },
            {
                headers: {
                    // 核心缓存配置
                    'Cache-Control': 'public, s-maxage=60',
                    'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600'
                }
            }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch profile data' },
            {
                status: 500,
                headers: { 'Cache-Control': 'no-store' } // 错误响应不缓存
            }
        );
    }
}