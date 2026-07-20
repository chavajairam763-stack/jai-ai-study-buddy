import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Award, Clock, Flame, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const [user, setUser] = useState<{ name: string; email: string; college?: string; branch?: string; semester?: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      setUser({
        name: p?.name || data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Student",
        email: data.user.email ?? "",
        college: p?.college ?? "", branch: p?.branch ?? "", semester: p?.semester ?? "",
      });
    })();
  }, []);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="glass relative overflow-hidden rounded-3xl p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-primary text-3xl font-bold text-primary-foreground glow-sm">
            {user.name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {user.college && <span className="glass rounded-full px-2.5 py-1">{user.college}</span>}
              {user.branch && <span className="glass rounded-full px-2.5 py-1">{user.branch}</span>}
              {user.semester && <span className="glass rounded-full px-2.5 py-1">{user.semester}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Flame} label="Streak" value="12 days" />
        <Stat icon={Clock} label="Study hours" value="86h" />
        <Stat icon={Award} label="Badges" value="7" />
        <Stat icon={TrendingUp} label="Progress" value="+22%" />
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="mb-4 font-semibold">Achievements</h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {["🏆", "🎯", "🔥", "📚", "💡", "⚡", "🌟", "🎓", "🚀", "💯", "🧠", "✨"].map((e, i) => (
            <div key={i} className="glass grid aspect-square place-items-center rounded-2xl text-2xl">{e}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
