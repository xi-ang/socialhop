import Link from "next/link";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from "./MobileNavbar";
import SearchBox from "./SearchBox";

function Navbar() {
  return (
    <nav className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary font-mono tracking-wider">
              SocialHop
            </Link>
          </div>

          {/* 搜索框 - 只在桌面端显示 */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchBox />
          </div>

          {/* 网页端顶部导航 */}
          <DesktopNavbar />
          {/* 移动端顶部导航 */}
          <MobileNavbar />
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
