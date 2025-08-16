"use client";

import AvatarUploadImproved from "./AvatarUploadImproved";

interface SmartAvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (newAvatarUrl: string) => void;
  userId?: string;
  className?: string;
}

/**
 * 智能头像上传组件
 * 使用云端上传（UploadThing）
 */
export default function SmartAvatarUpload({ 
  currentAvatar, 
  onAvatarChange, 
  userId = "default-user", 
  className 
}: SmartAvatarUploadProps) {
  return (
    <AvatarUploadImproved 
      initialImage={currentAvatar}
      userId={userId}
      onAvatarUpdate={onAvatarChange}
      className={className}
    />
  );
}
