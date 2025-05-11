import { NextResponse } from 'next/server';
import { toggleLike, createComment, deletePost, getPosts } from '@/actions/post.action';

// 获取帖子列表
export async function GET() {
  try {
    const posts = await getPosts();
    return NextResponse.json(posts, {
      headers: {
        'Cache-Control': 'max-age=60, stale-while-revalidate=3600', // 配置缓存策略
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}


// 点赞/取消点赞
export async function POST(req: Request, { params }: { params: { postId: string } }) {
  try {
    const { postId } = params;
    const result = await toggleLike(postId);
    
    if (!result?.success) {
      return NextResponse.json({ error: result?.error || 'Failed to toggle like' }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 删除帖子
export async function DELETE(req: Request, { params }: { params: { postId: string } }) {
  try {
    const { postId } = params;
    const result = await deletePost(postId);
    
    if (!result?.success) {
      return NextResponse.json({ error: result?.error || 'Failed to delete post' }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 添加评论
export async function PUT(req: Request, { params }: { params: { postId: string } }) {
  try {
    const { postId } = params;
    const { content } = await req.json();
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    
    const result = await createComment(postId, content);
    
    if (!result?.success) {
      return NextResponse.json({ error: result?.error || 'Failed to create comment' }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}