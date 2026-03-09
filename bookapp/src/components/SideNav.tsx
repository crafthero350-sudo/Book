import { Home, Search, BookOpen, Film, Heart, PlusSquare, User, Menu, Send } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { CreatePostSheet } from "@/components/CreatePostSheet";
import { StoryCreator } from "@/components/StoryCreator";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/search", icon: Search, label: "Search" },
  { path: "/reading", icon: BookOpen, label: "Reading" },
  { path: "/reels", icon: Film, label: "Reels" },
  { path: "/messages", icon: Send, label: "Messages" },
  { path: "/notifications", icon: Heart, label: "Notifications" },
  { path: "create", icon: PlusSquare, label: "Create" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const unreadCount = useUnreadMessages();

  const hiddenPaths = ["/auth", "/forgot-password", "/reset-password", "/welcome", "/setup"];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <>
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-[72px] xl:w-[220px] border-r border-border bg-background flex-col z-50 transition-all">
        {/* Logo */}
        <div className="flex items-center h-[72px] px-3 xl:px-5">
          <h1
            className="hidden xl:block text-xl font-bold italic tracking-tight text-foreground"
            style={{ fontFamily: "'Merriweather', serif" }}
          >
            BookApp
          </h1>
          <span className="xl:hidden text-xl font-bold italic text-foreground" style={{ fontFamily: "'Merriweather', serif" }}>B</span>
        </div>

        {/* Nav Items */}
        <div className="flex-1 flex flex-col gap-1 px-2 xl:px-3">
          {navItems.map((item) => {
            const active = item.path !== "create" && location.pathname === item.path;
            const isCreate = item.path === "create";

            if (isCreate) {
              return (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-4 px-3 py-3 rounded-lg transition-colors group hover:bg-accent w-full"
                    >
                      <div className="relative flex-shrink-0">
                        <item.icon
                          className="w-[26px] h-[26px] text-foreground/70 group-hover:text-foreground transition-colors"
                          strokeWidth={1.5}
                        />
                      </div>
                      <span className="hidden xl:block text-[15px] text-foreground/70 group-hover:text-foreground transition-colors">
                        {item.label}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-48">
                    <DropdownMenuItem onClick={() => setShowCreate(true)} className="cursor-pointer">
                      <PlusSquare className="w-4 h-4 mr-2" />
                      إنشاء بوست
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowStoryCreator(true)} className="cursor-pointer">
                      <Film className="w-4 h-4 mr-2" />
                      إنشاء ريلز
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-colors group hover:bg-accent ${
                  active ? "font-semibold" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <item.icon
                    className={`w-[26px] h-[26px] ${
                      active ? "text-foreground" : "text-foreground/70"
                    } group-hover:text-foreground transition-colors`}
                    strokeWidth={active ? 2.2 : 1.5}
                    fill={active && item.icon === Home ? "currentColor" : "none"}
                  />
                  {item.path === "/messages" && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span
                  className={`hidden xl:block text-[15px] ${
                    active ? "text-foreground font-semibold" : "text-foreground/70"
                  } group-hover:text-foreground transition-colors`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* More */}
        <div className="px-2 xl:px-3 pb-6">
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-4 px-3 py-3 rounded-lg transition-colors group hover:bg-accent w-full"
          >
            <Menu className="w-[26px] h-[26px] text-foreground/70 group-hover:text-foreground" strokeWidth={1.5} />
            <span className="hidden xl:block text-[15px] text-foreground/70 group-hover:text-foreground">More</span>
          </button>
        </div>
      </nav>

      <CreatePostSheet open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => setShowCreate(false)} />
      <StoryCreator open={showStoryCreator} onClose={() => setShowStoryCreator(false)} onCreated={() => setShowStoryCreator(false)} />
    </>
  );
}
