'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface PostsContextType {
  refreshPosts: () => void;
  refreshCounter: number;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refreshPosts = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  return (
    <PostsContext.Provider value={{ refreshPosts, refreshCounter }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}
