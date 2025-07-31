"use client";

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

interface User {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionAdd: (userId: string, username: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

export default function MentionInput({
  value,
  onChange,
  onMentionAdd,
  placeholder = "分享你的想法...",
  className = "",
  maxLength = 280
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 搜索用户
  const searchUsers = async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // 处理输入变化
  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPos);
    
    // 查找最后一个@符号
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      
      // 检查@后面是否只有字母、数字、下划线，且没有空格
      if (/^[a-zA-Z0-9_]*$/.test(textAfterAt) && !textAfterAt.includes(' ')) {
        setMentionStartPos(lastAtIndex);
        setShowSuggestions(true);
        searchUsers(textAfterAt);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
        setMentionStartPos(-1);
      }
    } else {
      setShowSuggestions(false);
      setMentionStartPos(-1);
    }
  };

  // 处理选择用户
  const selectUser = (user: User) => {
    if (mentionStartPos === -1) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const beforeMention = value.slice(0, mentionStartPos);
    const afterCursor = value.slice(cursorPos);
    
    const mentionText = `@${user.username} `;
    const newValue = beforeMention + mentionText + afterCursor;
    const newCursorPos = mentionStartPos + mentionText.length;

    onChange(newValue);
    onMentionAdd(user.id, user.username);
    setShowSuggestions(false);
    setMentionStartPos(-1);

    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        selectUser(suggestions[selectedIndex]);
        break;
      case 'Escape':
        setShowSuggestions(false);
        setMentionStartPos(-1);
        break;
    }
  };

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
      setMentionStartPos(-1);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        maxLength={maxLength}
      />

      {/* 用户建议列表 */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto">
          <CardContent className="p-0">
            {suggestions.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-50 ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
                onClick={() => selectUser(user)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.image || '/avatar.png'} alt={user.username} />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{user.name || user.username}</div>
                  <div className="text-xs text-muted-foreground">@{user.username}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
