"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { debounce } from "lodash";

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  // 创建防抖搜索函数
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      if (searchTerm.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      }
    }, 500),
    [router]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // 自动搜索（防抖）
    debouncedSearch(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // 取消之前的防抖搜索
      debouncedSearch.cancel();
      // 立即搜索
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
      <div className="relative flex-1">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="搜索帖子... (输入2个字符自动搜索)"
          value={query}
          onChange={handleInputChange}
          className="pl-10 pr-4"
        />
      </div>
      <Button type="submit" size="sm" disabled={!query.trim()}>
        搜索
      </Button>
    </form>
  );
}
