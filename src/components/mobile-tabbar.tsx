import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageSquare, FolderOpen, LineChart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/workspace", label: "Files", icon: FolderOpen },
  { to: "/market", label: "Market", icon: LineChart },
  { to: "/profile", label: "You", icon: User },
] as const;

/** Native-style bottom tab bar (mobile only). */
export function MobileTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="glass-strong fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t px-1 pb-[env(safe-area-inset-bottom)] pt-1 lg:hidden"
      aria-label="Primary"
    >
      {tabs.map(({ to, label, icon: Icon }) => {
        const active = path === to;
        return (
          <Link
            key={to}
            to={to}
            preload="intent"
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] transition-colors duration-200 active:scale-[0.94]",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_rgba(245,185,66,0.6)]")} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
