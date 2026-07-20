import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { Search, Bell, Settings2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 hidden items-center gap-3 border-b px-6 py-3 lg:flex">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search anything…" className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="glass rounded-full p-2 hover:bg-white/10" aria-label="Notifications"><Bell className="h-4 w-4" /></button>
            <button className="glass rounded-full p-2 hover:bg-white/10" aria-label="Theme"><Settings2 className="h-4 w-4" /></button>
            <div className="h-9 w-9 rounded-full bg-gradient-primary glow-sm" />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
