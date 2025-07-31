"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface CompatSignInButtonProps {
  mode?: "redirect" | "modal";
  children: ReactNode;
}

// 兼容Clerk SignInButton的组件
export function CompatSignInButton({ children }: CompatSignInButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push("/login");
  };

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}

interface CompatSignOutButtonProps {
  children: ReactNode;
}

// 兼容Clerk SignOutButton的组件
export function CompatSignOutButton({ children }: CompatSignOutButtonProps) {
  const router = useRouter();

  const handleClick = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}
