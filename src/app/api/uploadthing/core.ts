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
      const user = getUserFromRequest(req);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Single image upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
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
