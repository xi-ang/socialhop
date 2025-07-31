"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { XIcon } from "lucide-react";
import toast from "react-hot-toast";

interface ImageUploadProps {
  onChange: (url: string) => void;
  value: string;
  endpoint: "postImage";
}

function ImageUpload({ endpoint, onChange, value }: ImageUploadProps) {
  if (value) {
    return (
      <div className="relative w-full max-w-md">
        <img 
          src={value} 
          alt="Upload" 
          className="rounded-md w-full h-auto max-h-64 object-cover" 
        />
        <button
          onClick={() => onChange("")}
          className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full shadow-sm transition-colors"
          type="button"
        >
          <XIcon className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        const fileUrl = res?.[0]?.url;
        if (fileUrl) {
          onChange(fileUrl);
          toast.success("图片上传成功！");
        }
      }}
      onUploadError={(error: Error) => {
        console.error("Upload error:", error);
        toast.error("图片上传失败，请重试");
      }}
      onUploadBegin={() => {
        toast.loading("正在上传图片...", { id: "upload" });
      }}
      onDrop={() => {
        toast.dismiss("upload");
      }}
      appearance={{
        container: "border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors",
        uploadIcon: "text-muted-foreground",
        label: "text-muted-foreground hover:text-foreground transition-colors",
        allowedContent: "text-muted-foreground text-xs",
      }}
    />
  );
}

export default ImageUpload;
