export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import {
    getUserLikedPosts,
    getUserPosts,
    getUserCommentedPosts,
    isFollowing,
} from "@/lib/profile";

// 移除Edge Runtime配置，使用默认的Node.js Runtime
export const maxDuration = 30;

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId'); // 从查询参数获取 userId
        
        // 获取当前用户信息（可能为null，表示未登录）
        const currentUser = getUserFromRequest(request);
        const currentUserId = currentUser?.userId || null;

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId parameter' },
                { status: 400, headers: { 'Cache-Control': 'no-store' } }  //禁止缓存错误响应
            );
        }

        // 并行获取所有数据
        const [posts, likedPosts, commentedPosts, isCurrentUserFollowing] = await Promise.all([
            getUserPosts(userId),
            getUserLikedPosts(userId),
            getUserCommentedPosts(userId),
            currentUserId ? isFollowing(currentUserId, userId) : false,
        ]);

        console.log('API Response data:', {
            postsCount: posts?.length || 0,
            likedPostsCount: likedPosts?.length || 0,
            commentedPostsCount: commentedPosts?.length || 0,
            isCurrentUserFollowing
        });

        // 返回统一格式的 JSON
        return NextResponse.json({
            posts: posts || [],
            likedPosts: likedPosts || [],
            commentedPosts: commentedPosts || [],
            isCurrentUserFollowing,
        },
            {
                headers: {
                    // 禁用缓存以确保数据实时性
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }
        );
    } catch (error) {
        console.error('Profile API error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch profile data',
                posts: [],
                likedPosts: [],
                commentedPosts: [],
                isCurrentUserFollowing: false
            },
            {
                status: 500,
                headers: { 'Cache-Control': 'no-store' } // 错误响应不缓存
            }
        );
    }
}