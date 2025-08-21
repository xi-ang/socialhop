import { NextRequest, NextResponse } from 'next/server';

// 内部 API 用于广播通知到外部 WebSocket 服务器
export async function POST(request: NextRequest) {
  try {
    const { userId, notification } = await request.json();
    
    if (!userId || !notification) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or notification data' },
        { status: 400 }
      );
    }

    console.log('📡 Broadcasting notification via external WebSocket server...');
    console.log('📤 Data:', { userId, notification });
    
    // 直接向外部 WebSocket 服务器发送广播请求
    const port = process.env.WEBSOCKET_PORT || 8080;
    const baseUrl = process.env.WEBSOCKET_URL || `http://localhost:${port}`;
    const response = await fetch(`${baseUrl}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, notification }),
    });

    if (response.ok) {
      const result = await response.text();
      console.log('✅ Notification broadcasted successfully:', result);
      return NextResponse.json({ 
        success: true, 
        message: 'Notification broadcasted successfully',
        result
      });
    } else {
      const error = await response.text();
      console.warn('⚠️ Failed to broadcast notification:', response.status, error);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to broadcast: ${error}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Broadcast error:', error);
    return NextResponse.json(
      { success: false, error: 'WebSocket server not available' },
      { status: 500 }
    );
  }
}
