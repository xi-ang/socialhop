"use client";

import { BellIcon, HomeIcon, LogOutIcon, UserIcon, SettingsIcon, SunIcon, MoonIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "next-themes";


function DesktopNavbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, setTheme } = useTheme();


  if (!user) return null;

  return (
    <div className="hidden md:flex">
      <nav className="flex items-center space-x-1">
        <Button
          variant="ghost"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2" 
        >
          <div className="relative w-[1.2rem] h-[1.2rem]">
            <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute top-0 left-0 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </div>
          <span className="hidden lg:inline">主题</span>
        </Button>

        <Button variant="ghost" className="flex items-center gap-2" asChild>
          <Link href="/">
            <HomeIcon className="w-4 h-4" />
            <span className="hidden lg:inline">主页</span>
          </Link>
        </Button>

        <Button variant="ghost" className="flex items-center gap-2 relative" asChild>
          <Link href="/notifications">
            <BellIcon className="w-4 h-4" />
            <span className="hidden lg:inline">通知</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </Button>

        <Button variant="ghost" className="flex items-center gap-2" asChild>
          <Link href={`/profile/${user.id}`}>
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
