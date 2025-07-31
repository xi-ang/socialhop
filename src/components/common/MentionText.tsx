'use client';

import React from 'react';
import Link from 'next/link';
import { renderMentions } from '@/lib/security';
import { AtSignIcon } from 'lucide-react';

interface MentionTextProps {
  content: string;
  className?: string;
}

// 用户名点击处理组件
function MentionLink({ username, children }: { username: string; children: React.ReactNode }) {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // 通过username查找用户ID
      const response = await fetch(`/api/users/by-username/${username}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.userId) {
          window.location.href = `/profile/${data.userId}`;
        } else {
          console.warn(`User not found: ${username}`);
        }
      }
    } catch (error) {
      console.error('Error finding user:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center bg-purple-50 text-purple-700 hover:text-purple-900 hover:bg-purple-100 px-1 py-0.5 rounded-md font-medium transition-all duration-200 border border-purple-200 cursor-pointer"
    >
      {children}
    </button>
  );
}

export default function MentionText({ content, className = '' }: MentionTextProps) {
  const parts = renderMentions(content);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'mention' && part.username) {
          return (
            <MentionLink key={index} username={part.username}>
              <AtSignIcon className="w-3 h-3 mr-0.5" />
              {part.username}
            </MentionLink>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
}
