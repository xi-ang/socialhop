import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getUserFromRequest } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // 单张图片上传 (头像等)
  singleImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      try {
        // 尝试获取认证信息
        const authHeader = req.headers.get('authorization');
        
        console.log("singleImage middleware - Auth header:", authHeader ? 'Present' : 'Missing');
        
        if (!authHeader) {
          console.warn("No authentication found in request");
          // 对于头像上传，我们暂时允许匿名上传，但记录用户ID为anonymous
          return { userId: "anonymous" };
        }
        
        const user = getUserFromRequest(req);
        if (!user) {
          console.warn("No user found in singleImage middleware, allowing anonymous upload");
          return { userId: "anonymous" };
        }
        
        console.log("singleImage middleware - userId:", user.userId);
        return { userId: user.userId };
      } catch (error) {
        console.error("Error in singleImage middleware:", error);
        // 降级处理：允许匿名上传
        return { userId: "anonymous" };
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Single image upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      // ✅ 上传完成回调 - 返回文件URL
      return { fileUrl: file.url };
    }),

  // 多张图片上传 (帖子图片)
  multipleImages: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 9, // 最多9张图片
    },
  })
    .middleware(async ({ req }) => {
      // 尝试获取用户，但即使失败也允许上传
      try {
        const user = getUserFromRequest(req);
        if (user) {
          return { userId: user.userId };
        } 
      } catch (error) {
        console.error("Auth error in uploadthing middleware:", error);
      }
      
      // 允许未认证的上传，使用一个默认 ID
      return { userId: "anonymous-user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Multiple images upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { fileUrl: file.url };
    }),

  // 保持向后兼容
  postImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = getUserFromRequest(req);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Post image upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
