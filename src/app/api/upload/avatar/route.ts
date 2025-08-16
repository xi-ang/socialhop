import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('Avatar upload attempt - checking authorization...');
    
    // Debug: 检查请求头
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    
    const user = getUserFromRequest(request);
    console.log('User from request:', user ? `User ID: ${(user as any).userId}` : 'No user');
    
    if (!user) {
      console.log('Authorization failed - no valid user token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 验证文件类型 - 头像只支持常见图片格式
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: '头像只支持 JPEG、PNG、WebP 格式的图片' 
      }, { status: 400 });
    }

    // 验证文件大小 - 头像限制更严格 (4MB)
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: '头像大小不能超过 4MB' 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // 目录已存在，忽略错误
    }

    // 生成唯一文件名 - 添加avatar前缀便于管理
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `avatar-${timestamp}-${randomString}.${extension}`;
    const filePath = join(uploadDir, fileName);

    // 保存文件
    await writeFile(filePath, buffer);

    // 返回文件 URL
    const fileUrl = `/uploads/${fileName}`;

    console.log(`Avatar uploaded for user ${(user as any).id}: ${fileUrl}`);

    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      originalName: file.name,
      size: file.size 
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ 
      error: '头像上传失败，请重试' 
    }, { status: 500 });
  }
}
