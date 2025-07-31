"use client";

import { BellIcon, HomeIcon, LogOutIcon, UserIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

function DesktopNavbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="hidden md:flex">
      <nav className="flex items-center space-x-1">
        <Button variant="ghost" className="flex items-center gap-2" asChild>
          <Link href="/">
            <HomeIcon className="w-4 h-4" />
            <span className="hidden lg:inline">主页</span>
          </Link>
        </Button>

        <Button variant="ghost" className="flex items-center gap-2" asChild>
          <Link href="/notifications">
            <BellIcon className="w-4 h-4" />
            <span className="hidden lg:inline">通知</span>
          </Link>
        </Button>

        <Button variant="ghost" className="flex items-center gap-2" asChild>
          <Link href={user.username ? `/profile/${user.username}` : '/profile'}>
            <UserIcon className="w-4 h-4" />
            <span className="hidden lg:inline">资料</span>
          </Link>
        </Button>

        <Button variant="ghost" className="flex items-center gap-2" asChild>
          <Link href="/settings">
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden lg:inline">设置</span>
          </Link>
        </Button>

        <Button 
          variant="ghost" 
          className="flex items-center gap-2" 
          onClick={logout}
        >
          <LogOutIcon className="w-4 h-4" />
          <span className="hidden lg:inline">退出</span>
        </Button>
      </nav>
    </div>
  );
}

export default DesktopNavbar;
