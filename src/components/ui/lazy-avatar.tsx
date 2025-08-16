"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

// 头像容器，React.forwardRef 用于将父组件的 ref 转发给子组件内部的 DOM 节点
const LazyAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
LazyAvatar.displayName = "LazyAvatar";

interface LazyAvatarImageProps extends Omit<React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>, 'src'> {
  src: string;
  alt: string;
  fallback?: string;  // 可选的错误图片
}

// 头像图片，直接显示，不使用懒加载
const LazyAvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  LazyAvatarImageProps
>(({ className, src, alt, fallback = "/avatar.png", ...props }, ref) => {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={src}
      alt={alt}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  )
})
LazyAvatarImage.displayName = "LazyAvatarImage";

// 头像占位符组件，当头像未设置或加载失败时显示
const LazyAvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
LazyAvatarFallback.displayName = "LazyAvatarFallback";

export { LazyAvatar, LazyAvatarImage, LazyAvatarFallback };
