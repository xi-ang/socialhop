/**
 * 上传配置 - 控制是否使用云端上传
 * 
 * 设置为 true：所有图片上传到 UploadThing 云端
 * 设置为 false：图片上传到本地 uploads 文件夹
 */

// 🚀 云端上传配置
export const UPLOAD_CONFIG = {
  // 是否启用云端上传（UploadThing）
  USE_CLOUD_UPLOAD: true, // 改为 false 可切换回本地上传
  
  // 云端上传配置
  CLOUD: {
    MAX_FILE_SIZE: "4MB",
    MAX_FILES_POST: 9, // 帖子最多上传图片数量
    MAX_FILES_AVATAR: 1, // 头像上传数量
    SUPPORTED_FORMATS: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  
  // 本地上传配置（向后兼容）
  LOCAL: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    UPLOAD_DIR: "/uploads",
    SUPPORTED_FORMATS: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  }
};

// 🎯 获取当前上传模式的配置
export const getUploadConfig = () => {
  return UPLOAD_CONFIG.USE_CLOUD_UPLOAD ? UPLOAD_CONFIG.CLOUD : UPLOAD_CONFIG.LOCAL;
};

// 📝 上传模式描述
export const getUploadModeDescription = () => {
  return UPLOAD_CONFIG.USE_CLOUD_UPLOAD 
    ? "🌩️ 云端存储模式 - 图片存储在 UploadThing CDN，加载更快"
    : "💾 本地存储模式 - 图片存储在服务器本地";
};
