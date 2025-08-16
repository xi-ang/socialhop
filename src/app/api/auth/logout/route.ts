import { NextRequest, NextResponse } from 'next/server';

// 登出处理（客户端负责清除 localStorage 中的 token）
export async function POST(request: NextRequest) {
  try {
    // 由于 token 存储在客户端 localStorage 中，服务端无需特殊处理
    // 只需要返回成功响应，实际的 token 清除由客户端完成
    return NextResponse.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: '登出失败，请稍后重试' },
      { status: 500 }
    );
  }
}
