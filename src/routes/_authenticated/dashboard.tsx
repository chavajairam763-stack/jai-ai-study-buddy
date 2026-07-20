import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Target, TrendingUp, Clock, BookOpen, MessageSquare, FileText, GraduationCap, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const [name, setName] = useState("Student");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const n = data.user?.user_metadata?.name || data.user?.user_metadata?.full_name || data.user?.email?.split("@")[0];
      if (n) setName(String(n).split(" ")[0]);
    });
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hello, {name} 👋</h1>
          <p className="mt-1 text-muted-foreground">Here's your learning at a glance today.</p>
        </div>
        <Link to="/chat" className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-sm">Ask JAI →</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Flame} label="Study Streak" value="12 days" color="from-orange-500 to-rose-500" />
        <Stat icon={Target} label="Daily Goal" value="65%" color="from-emerald-500 to-teal-500" />
        <Stat icon={Clock} label="Today" value="2h 45m" color="from-blue-500 to-cyan-500" />
        <Stat icon={TrendingUp} label="This week" value="+18%" color="from-purple-500 to-fuchsia-500" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass lg:col-span-2 rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Continue Learning</h3>
            <button className="text-xs text-muted-foreground hover:text-foreground">View all</button>
          </div>
          <div className="space-y-3">
            {[
              { title: "Data Structures — Trees", pct: 72, subj: "CSE" },
              { title: "Thermodynamics — Chapter 4", pct: 41, subj: "Mech" },
              { title: "Signals & Systems", pct: 88, subj: "ECE" },
            ].map((s) => (
              <div key={s.title} className="rounded-xl border border-white/5 bg-white/5 p-4 hover:bg-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.subj}</div>
                  </div>
                  <button className="text-primary"><ArrowRight className="h-4 w-4" /></button>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-gradient-primary" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
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

      <div className="glass rounded-2xl p-6">
        <h3 className="mb-4 font-semibold">Recent Subjects</h3>
        <div className="flex flex-wrap gap-2">
          {["Mathematics", "Physics", "Computer Networks", "DBMS", "Machine Learning", "Operating Systems"].map((s) => (
            <span key={s} className="glass rounded-full px-3 py-1.5 text-xs">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className={`inline-flex rounded-xl bg-gradient-to-br ${color} p-2 shadow-lg`}><Icon className="h-4 w-4 text-white" /></div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
