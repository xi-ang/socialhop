#!/usr/bin/env node

console.log('🧪 Testing notification flow...');

// 测试WebSocket服务器健康状态
async function testWebSocketHealth() {
  try {
    const response = await fetch('http://localhost:8080/health');
    const data = await response.json();
    console.log('✅ WebSocket server health:', data);
    return true;
  } catch (error) {
    console.error('❌ WebSocket server health check failed:', error.message);
    return false;
  }
}

// 测试广播功能
async function testBroadcast() {
  try {
    const testNotification = {
      id: 'test-notification-id',
      type: 'LIKE',
      createdAt: new Date().toISOString(),
      read: false,
      creator: {
        id: 'test-creator-id',
        username: 'testuser',
        name: 'Test User',
        image: null
      },
      post: null,
      commentId: null,
    };

    const response = await fetch('http://localhost:8080/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-recipient-id',
        notification: testNotification
      }),
    });

    const result = await response.json();
    console.log('✅ Broadcast test result:', result);
    return true;
  } catch (error) {
    console.error('❌ Broadcast test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n1. Testing WebSocket server health...');
  const healthOk = await testWebSocketHealth();
  
  console.log('\n2. Testing broadcast functionality...');
  const broadcastOk = await testBroadcast();
  
  console.log('\n📊 Test Results:');
  console.log(`   Health Check: ${healthOk ? '✅' : '❌'}`);
  console.log(`   Broadcast: ${broadcastOk ? '✅' : '❌'}`);
  
  if (healthOk && broadcastOk) {
    console.log('\n🎉 All tests passed! WebSocket server is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the WebSocket server.');
  }
}

runTests().catch(console.error);
