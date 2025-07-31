import { createUploadthing, type FileRouter } from "uploadthing/next";
import { JwtService } from "@/lib/jwt";
import { cookies } from "next/headers";

const f = createUploadthing();

export const ourFileRouter = {
  // define routes for different upload types
  postImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // 临时简化 - 只返回一个测试用户ID
      console.log("Upload middleware called");
      return { userId: "test-user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Upload complete for userId:", metadata.userId);
        console.log("File info:", {
          url: file.url,
          ufsUrl: file.ufsUrl,
          name: file.name,
          size: file.size
        });
        return { fileUrl: file.url || file.ufsUrl };
      } catch (error) {
        console.error("Error in onUploadComplete:", error);
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
