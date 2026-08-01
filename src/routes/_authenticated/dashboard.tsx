import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Bookmark, Flame, Sparkles, ArrowRight, Zap, Activity, Plus, FolderOpen, Code2, Calculator } from "lucide-react";
import { TOOL_LIST, TOOLS, type ToolId } from "@/lib/tools";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Home — JAI.AI" }] }),
});

type Recent = { id: string; title: string; tool: ToolId; updated_at: string };
type Saved = { id: string; title: string; created_at: string };
type Stats = {
  name: string;
  chatsToday: number;
  streak: number;
  weekMessages: number;
  savedCount: number;
  recent: Recent[];
  saved: Saved[];
};

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function computeStreak(dateStrings: string[]): number {
  const days = new Set(dateStrings.map((s) => new Date(s).toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // If nothing today, still allow streak counting from yesterday
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;
      const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
      const streakWindow = new Date(Date.now() - 60 * 86400_000).toISOString();

      const [
        { data: profile },
        todayHead,
        weekHead,
        savedHead,
        { data: recent },
        { data: saved },
        { data: streakRows },
      ] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("role", "user").gte("created_at", startOfToday()),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", weekAgo),
        supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("conversations").select("id,title,tool,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(6),
        supabase.from("bookmarks").select("id,title,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("chat_messages").select("created_at").eq("user_id", user.id).eq("role", "user").gte("created_at", streakWindow).order("created_at", { ascending: false }),
      ]);

      const displayName = String(profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "there").split(" ")[0];
      setS({
        name: displayName,
        chatsToday: todayHead.count ?? 0,
        streak: computeStreak((streakRows ?? []).map((r) => r.created_at)),
        weekMessages: weekHead.count ?? 0,
        savedCount: savedHead.count ?? 0,
        recent: (recent ?? []) as Recent[],
        saved: (saved ?? []) as Saved[],
      });
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Hello, {s?.name ?? "there"} <span aria-hidden>👋</span></h1>
          <p className="mt-1 text-sm text-muted-foreground">One AI. Endless Possibilities.</p>
        </div>
        <Link to="/chat" className="group inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-sm">
          <Sparkles className="h-4 w-4" /> New chat
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={MessageSquare} label="Chats Today" value={s?.chatsToday} hint="Messages you sent today" />
        <Stat icon={Flame} label="Study Streak" value={s?.streak} hint={s && s.streak > 0 ? `${s.streak} day${s.streak === 1 ? "" : "s"} in a row` : "Chat today to start"} />
        <Stat icon={Zap} label="AI Usage · 7d" value={s?.weekMessages} hint="Total messages this week" />
        <Stat icon={Bookmark} label="Saved Chats" value={s?.savedCount} hint="Bookmarked answers" />
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction to="/chat" icon={Plus} label="New Chat" />
          <QuickAction to="/workspace" icon={FolderOpen} label="Open PDF" />
          <QuickAction to="/developer" icon={Code2} label="Debug Code" />
          <QuickAction to="/calculator" icon={Calculator} label="Solve Math" />
        </div>
      </section>

      {/* Tools grid */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">AI Tools</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOL_LIST.map((t) => (
            <Link
              key={t.slug}
              to={`/${t.slug}`}
              className="glass group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:glow-sm"
            >
              <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${t.accent} p-2.5 shadow-lg`}>
                <t.icon className="h-5 w-5 text-black" />
              </div>
              <h3 className="font-semibold">{t.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
              <ArrowRight className="absolute right-4 top-5 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
            <Activity className="h-3.5 w-3.5" /> Recent Activity
          </h2>
          {s === null ? (
            <div className="grid gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-14" />)}</div>
          ) : s.recent.length === 0 ? (
            <EmptyState label="No conversations yet." to="/chat" cta="Start your first chat" />
          ) : (
            <div className="grid gap-2">
              {s.recent.map((c) => {
                const tool = TOOLS[c.tool] ?? TOOLS.chat;
                return (
                  <Link key={c.id} to={`/${tool.slug}`} className="glass flex items-center gap-3 rounded-xl p-4 transition-colors hover:bg-white/5">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${tool.accent}`}>
                      <tool.icon className="h-4 w-4 text-black" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{tool.label} · {relTime(c.updated_at)}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Saved Chats */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
            <Bookmark className="h-3.5 w-3.5" /> Saved Chats
          </h2>
          {s === null ? (
            <div className="grid gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-14" />)}</div>
          ) : s.saved.length === 0 ? (
            <EmptyState label="No bookmarks yet." to="/chat" cta="Bookmark an answer" />
          ) : (
            <div className="grid gap-2">
              {s.saved.map((b) => (
                <div key={b.id} className="glass flex items-center gap-3 rounded-xl p-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-primary">
                    <Bookmark className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{b.title}</div>
                    <div className="text-xs text-muted-foreground">{relTime(b.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** Counts up to `value` with an eased animation once the data arrives. */
function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (value <= 0) { setShown(0); return; }
    let raf = 0;
    const start = performance.now();
    const duration = 700;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown}</>;
}

function Stat({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | undefined; hint?: string }) {
  return (
    <div className="glass rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:glow-sm">
      <div className="inline-flex rounded-xl bg-gradient-primary p-2 shadow-lg"><Icon className="h-4 w-4 text-primary-foreground" /></div>
      <div className={`mt-3 text-2xl font-bold tabular-nums ${value === undefined ? "opacity-40" : ""}`}>
        {value === undefined ? "—" : <AnimatedNumber value={value} />}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground/60">{hint}</div>}
    </div>
  );
}


function QuickAction({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="glass flex items-center gap-2.5 rounded-xl p-3.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:bg-white/5 hover:glow-sm">
      <Icon className="h-4 w-4 text-primary" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function EmptyState({ label, to, cta }: { label: string; to: string; cta: string }) {
  return (
    <div className="glass rounded-2xl border border-dashed border-white/10 p-8 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <Link to={to} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
