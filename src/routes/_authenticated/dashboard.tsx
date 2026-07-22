import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Target, TrendingUp, Clock, BookOpen, MessageSquare, FileText, GraduationCap, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

type Stats = {
  name: string;
  streak: number;
  hours: number;
  todayMessages: number;
  weekMessages: number;
  goalPct: number;
  recentSubjects: string[];
};

const DAILY_GOAL_MESSAGES = 10;

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      const [{ data: profile }, { data: today }, { data: week }] = await Promise.all([
        supabase.from("profiles").select("name, study_streak, study_hours").eq("id", user.id).maybeSingle(),
        supabase.from("chat_messages").select("content, created_at").eq("user_id", user.id).eq("role", "user").gte("created_at", startOfDay()),
        supabase.from("chat_messages").select("id").eq("user_id", user.id).gte("created_at", daysAgo(7)),
      ]);

      const displayName = String(profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "Student").split(" ")[0];
      const todayMessages = today?.length ?? 0;
      const goalPct = Math.min(100, Math.round((todayMessages / DAILY_GOAL_MESSAGES) * 100));

      // Update streak once per day when user is active
      const streak = await bumpStreak(user.id, profile?.study_streak ?? 0);

      setStats({
        name: displayName,
        streak,
        hours: profile?.study_hours ?? 0,
        todayMessages,
        weekMessages: week?.length ?? 0,
        goalPct,
        recentSubjects: extractSubjects(today ?? []),
      });
    })();
  }, []);

  const s = stats;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Hello, {s?.name ?? "there"} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's your learning at a glance today.</p>
        </div>
        <Link to="/chat" className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-sm">Ask JAI →</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Flame} label="Study Streak" value={s ? `${s.streak} day${s.streak === 1 ? "" : "s"}` : "—"} color="from-orange-500 to-rose-500" loading={!s} />
        <Stat icon={Target} label="Daily Goal" value={s ? `${s.goalPct}%` : "—"} color="from-emerald-500 to-teal-500" loading={!s} />
        <Stat icon={Clock} label="Today" value={s ? `${s.todayMessages} chat${s.todayMessages === 1 ? "" : "s"}` : "—"} color="from-blue-500 to-cyan-500" loading={!s} />
        <Stat icon={TrendingUp} label="This week" value={s ? `${s.weekMessages} msgs` : "—"} color="from-purple-500 to-fuchsia-500" loading={!s} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass lg:col-span-2 rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Today's goal</h3>
            <span className="text-xs text-muted-foreground">{s?.todayMessages ?? 0} / {DAILY_GOAL_MESSAGES}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${s?.goalPct ?? 0}%` }} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {s && s.goalPct >= 100 ? "🎉 Goal smashed — keep the streak alive tomorrow!" : "Ask JAI a few questions today to hit your goal."}
          </p>

          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold">Continue where you left off</h4>
            {(s?.recentSubjects.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-muted-foreground">
                No recent topics yet. <Link to="/chat" className="text-primary hover:underline">Start a chat</Link> to see them here.
              </div>
            ) : (
              s!.recentSubjects.map((title) => (
                <Link key={title} to="/chat" className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 hover:bg-white/10">
                  <span className="truncate text-sm font-medium">{title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="mb-4 font-semibold">Quick Access</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: "/chat", label: "AI Chat", icon: MessageSquare },
              { to: "/pdf", label: "PDF", icon: FileText },
              { to: "/notes", label: "Notes", icon: BookOpen },
              { to: "/exam", label: "Exam", icon: GraduationCap },
            ].map((q) => (
              <Link key={q.to} to={q.to} className="glass-strong flex flex-col items-center gap-2 rounded-xl p-4 text-center hover:glow-sm">
                <q.icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color, loading }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string; loading?: boolean }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className={`inline-flex rounded-xl bg-gradient-to-br ${color} p-2 shadow-lg`}><Icon className="h-4 w-4 text-white" /></div>
      <div className={`mt-3 text-2xl font-bold ${loading ? "opacity-40" : ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function extractSubjects(rows: { content: string }[]): string[] {
  const seen = new Set<string>();
  for (const r of rows.slice(-10).reverse()) {
    const t = r.content.split("\n")[0].slice(0, 60).trim();
    if (t && !seen.has(t.toLowerCase())) seen.add(t.toLowerCase()), [...seen];
  }
  return rows.slice(-3).reverse().map((r) => r.content.split("\n")[0].slice(0, 60).trim()).filter(Boolean);
}

const STREAK_KEY = "jai.streak.lastBumpDate";
async function bumpStreak(userId: string, current: number): Promise<number> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem(STREAK_KEY);
    if (last === today) return current;
    const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
    const next = last === yesterday ? current + 1 : current === 0 ? 1 : (last ? 1 : current + 1);
    localStorage.setItem(STREAK_KEY, today);
    await supabase.from("profiles").update({ study_streak: next }).eq("id", userId);
    return next;
  } catch {
    return current;
  }
}
