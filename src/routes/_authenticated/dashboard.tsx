import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Bookmark, StickyNote, Sparkles, ArrowRight, Clock } from "lucide-react";
import { TOOL_LIST, TOOLS, type ToolId } from "@/lib/tools";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Home — JAI.AI" }] }),
});

type Recent = { id: string; title: string; tool: ToolId; updated_at: string };
type Stats = {
  name: string;
  conversations: number;
  weekMessages: number;
  notes: number;
  bookmarks: number;
  recent: Recent[];
};

function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;
      const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
      const [{ data: profile }, convHead, weekHead, notesHead, bmHead, { data: recent }] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", weekAgo),
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("conversations").select("id,title,tool,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(6),
      ]);
      const displayName = String(profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "there").split(" ")[0];
      setS({
        name: displayName,
        conversations: convHead.count ?? 0,
        weekMessages: weekHead.count ?? 0,
        notes: notesHead.count ?? 0,
        bookmarks: bmHead.count ?? 0,
        recent: (recent ?? []) as Recent[],
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

      {/* Real stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={MessageSquare} label="Conversations" value={s?.conversations} />
        <Stat icon={Clock} label="Messages · 7d" value={s?.weekMessages} />
        <Stat icon={StickyNote} label="Notes" value={s?.notes} />
        <Stat icon={Bookmark} label="Bookmarks" value={s?.bookmarks} />
      </div>

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

      {/* Recent */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">Recent conversations</h2>
        {s === null ? (
          <div className="grid gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-14" />)}</div>
        ) : s.recent.length === 0 ? (
          <div className="glass rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
            <Link to="/chat" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Start your first chat <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | undefined }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="inline-flex rounded-xl bg-gradient-primary p-2 shadow-lg"><Icon className="h-4 w-4 text-primary-foreground" /></div>
      <div className={`mt-3 text-2xl font-bold ${value === undefined ? "opacity-40" : ""}`}>{value ?? "—"}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
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
