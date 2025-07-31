"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimpleLikeTestPage() {
  const [postId, setPostId] = useState('');
  const [result, setResult] = useState('');

  const testLike = async () => {
    if (!postId) {
      alert('请输入帖子ID');
      return;
    }

    try {
      console.log('🚀 Testing like for post:', postId);
      
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📋 Like response:', data);
      
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Like test failed:', error);
      setResult('Error: ' + String(error));
    }
  };

  const getPostList = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      console.log('📋 Available posts:', data.posts?.slice(0, 3));
      
      if (data.posts && data.posts.length > 0) {
        setPostId(data.posts[0].id);
        setResult('设置了第一个帖子ID: ' + data.posts[0].id);
      }
    } catch (error) {
      console.error('❌ Failed to get posts:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">点赞功能测试</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>测试步骤</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button onClick={getPostList} className="mr-2">
              获取帖子列表
            </Button>
            <span className="text-sm text-muted-foreground">
              点击获取可用的帖子ID
            </span>
          </div>
          
          <div>
            <input
              type="text"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              placeholder="输入帖子ID"
              className="border rounded px-3 py-2 w-full mb-2"
            />
          </div>
          
          <div>
            <Button onClick={testLike} className="w-full">
              测试点赞
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>打开浏览器开发者工具查看控制台日志</p>
            <p>在Network标签页可以看到API请求</p>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
