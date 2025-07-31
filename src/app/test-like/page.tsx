'use client';

import { useState } from 'react';

export default function TestLikePage() {
  const [postId, setPostId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLike = async () => {
    if (!postId.trim()) {
      alert('请输入帖子ID');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testing like API for post:', postId);
      
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      console.log('🧪 Like API response:', data);
      setResult({
        status: response.status,
        data: data,
        success: response.ok
      });
    } catch (error) {
      console.error('🧪 Like API error:', error);
      setResult({
        status: 'ERROR',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">测试点赞功能</h1>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="postId" className="block text-sm font-medium mb-2">
            帖子 ID:
          </label>
          <input
            type="text"
            id="postId"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="输入要点赞的帖子ID"
          />
        </div>
        
        <button
          onClick={testLike}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '测试中...' : '测试点赞'}
        </button>
        
        {result && (
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
            <h3 className="font-medium mb-2">测试结果:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 p-4 border rounded-md bg-blue-50">
          <h3 className="font-medium mb-2">说明:</h3>
          <p className="text-sm text-gray-600">
            1. 用户A ID: cmdpypenx0000o8m0qhytk5xm<br/>
            2. 用户B ID: cmdpjvbht0000o8283fq3kh5b<br/>
            3. 请确保在用户B的浏览器中使用此页面测试<br/>
            4. 输入用户A的帖子ID进行测试<br/>
            5. 查看浏览器开发者工具的控制台查看详细日志
          </p>
        </div>
      </div>
    </div>
  );
}
