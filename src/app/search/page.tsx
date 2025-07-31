"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PostCard from "@/components/posts/PostCard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchIcon } from "lucide-react";

interface Post {
  id: string;
  content: string;
  image?: string | null;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
  };
  likes: { userId: string }[];
  comments: any[];
  _count: {
    likes: number;
    comments: number;
  };
}

export default function SearchResults() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      searchPosts(query);
    }
  }, [query]);

  const searchPosts = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to search posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchIcon className="w-5 h-5" />
              搜索结果加载中...
            </CardTitle>
          </CardHeader>
        </Card>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card p-6 rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="w-5 h-5" />
            搜索结果
          </CardTitle>
          {query && (
            <p className="text-sm text-muted-foreground">
              搜索关键词: "{query}" - 找到 {posts.length} 条结果
            </p>
          )}
        </CardHeader>
      </Card>

      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post as any} dbUserId={user?.id || null} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">没有找到相关帖子</h3>
            <p className="text-muted-foreground">
              {query ? `没有找到包含 "${query}" 的帖子` : '请输入搜索关键词'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
