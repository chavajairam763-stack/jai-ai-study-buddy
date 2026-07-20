import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home, MessageSquare, FileText, StickyNote, BookOpen, ClipboardList,
  GraduationCap, Layers, CalendarDays, Bookmark, User, Settings, Crown, LogOut, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/pdf", label: "PDF Analysis", icon: FileText },
  { to: "/notes", label: "Notes", icon: StickyNote },
  { to: "/papers", label: "Previous Papers", icon: BookOpen },
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/exam", label: "Exam Mode", icon: GraduationCap },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/planner", label: "Study Planner", icon: CalendarDays },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const nav = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 px-2"><Logo /></div>
      {items.map((it) => {
        const active = path === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
              active
                ? "bg-gradient-primary text-primary-foreground glow-sm"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <it.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{it.label}</span>
          </Link>
        );
      })}
      <div className="mt-auto flex flex-col gap-2 pt-4">
        <button className="flex items-center gap-3 rounded-xl bg-gradient-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground glow-sm">
          <Crown className="h-4 w-4" /> Upgrade to Pro
        </button>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="glass sticky top-0 z-40 flex w-full items-center justify-between border-b px-4 py-3 lg:hidden">
        <Logo />
        <button onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-white/5" aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <div className="glass-strong absolute left-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {nav}
          </div>
        </div>
      )}
      {/* Desktop */}
      <aside className="glass hidden h-screen w-64 shrink-0 border-r lg:sticky lg:top-0 lg:block">
        {nav}
      </aside>
    </>
  );
}
