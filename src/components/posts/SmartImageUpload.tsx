"use client";

import { UPLOAD_CONFIG } from "@/lib/upload-config";
import MultiImageUpload from "./MultiImageUpload";
import MultiImageUploadImproved from "./MultiImageUploadImproved";

interface SmartImageUploadProps {
  onChange: (urls: string[]) => void;
  value: string[];
  maxCount?: number;
}

/**
 * 智能图片上传组件
 * 根据配置自动选择使用云端上传还是本地上传
 */
export default function SmartImageUpload(props: SmartImageUploadProps) {
  if (UPLOAD_CONFIG.USE_CLOUD_UPLOAD) {
    // 使用云端上传（UploadThing）
    return <MultiImageUploadImproved {...props} />;
  } else {
    // 使用本地上传（原有方式）
    return <MultiImageUpload {...props} />;
  }
}
