"use client";

import BasicAvatarUpload from "./BasicAvatarUpload";
import SimpleUploadAvatar from "./SimpleUploadAvatarNew";

interface SmartAvatarUploadProps {
  initialImage?: string | null;
  userId: string;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  className?: string;
}

/**
 * 智能头像上传组件
 * 根据配置自动选择使用云端上传还是本地上传
 */
export default function SmartAvatarUpload(props: SmartAvatarUploadProps) {
  // 转换 props 格式
  const uploadProps = {
    userId: props.userId,
    avatarUrl: props.initialImage || undefined,
    onUploadSuccess: (url: string) => {
      if (props.onAvatarUpdate) {
        props.onAvatarUpdate(url);
      }
    }
  };

  // 测试简单的 UploadThing 组件
  const USE_CLOUD_UPLOAD = true;
  
  if (USE_CLOUD_UPLOAD) {
    // 使用简单的 UploadThing 测试组件
    return <SimpleUploadAvatar {...uploadProps} />;
  } else {
    // 使用本地上传（原有方式）
    return <BasicAvatarUpload {...props} />;
  }
}