import { Home, Search, BookOpen, Film, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/search", icon: Search, label: "Search" },
  { path: "/reading", icon: BookOpen, label: "Reading" },
  { path: "/reels", icon: Film, label: "Reels" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const hiddenPaths = ["/read/", "/auth", "/forgot-password", "/reset-password", "/welcome", "/setup"];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p)) || location.pathname === "/reels" || location.pathname.startsWith("/settings") || location.pathname.startsWith("/user/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 md:hidden">
      <div className="flex items-center justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center w-12 h-10"
            >
              <item.icon
                className={`w-[26px] h-[26px] ${active ? "text-foreground" : "text-muted-foreground"}`}
                strokeWidth={active ? 2 : 1.5}
                fill={active && item.icon === Home ? "currentColor" : "none"}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
