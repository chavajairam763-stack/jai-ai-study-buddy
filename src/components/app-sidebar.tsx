import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, User, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { TOOL_LIST } from "@/lib/tools";
import { useQueryClient } from "@tanstack/react-query";

const primary = [{ to: "/dashboard", label: "Home", icon: Home }] as const;
const secondary = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const NavLink = ({ to, label, Icon }: { to: string; label: string; Icon: React.ComponentType<{ className?: string }> }) => {
    const active = path === to;
    return (
      <Link
        to={to}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
          active
            ? "bg-gradient-primary text-primary-foreground glow-sm"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  const nav = (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-4">
      <div className="mb-4 px-2"><Logo /></div>
      {primary.map((it) => <NavLink key={it.to} to={it.to} label={it.label} Icon={it.icon} />)}
      <div className="mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">AI Tools</div>
      {TOOL_LIST.map((t) => (
        <NavLink key={t.slug} to={`/${t.slug}`} label={t.label} Icon={t.icon} />
      ))}
      <div className="mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Account</div>
      {secondary.map((it) => <NavLink key={it.to} to={it.to} label={it.label} Icon={it.icon} />)}
      <div className="mt-auto pt-4">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <div className="glass sticky top-0 z-40 flex w-full items-center justify-between border-b px-4 py-3 lg:hidden">
        <Logo />
        <button onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-white/5" aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <div className="glass-strong absolute left-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {nav}
          </div>
        </div>
      )}
      <aside className="glass hidden h-screen w-64 shrink-0 border-r lg:sticky lg:top-0 lg:block">
        {nav}
      </aside>
    </>
  );
}
