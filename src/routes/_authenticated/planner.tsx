import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/_authenticated/planner")({ component: Page });

function Page() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><CalendarDays className="h-7 w-7 text-primary" /> Study Planner</h1>
        <p className="mt-1 text-muted-foreground">Your weekly plan at a glance.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((d, i) => (
          <div key={d} className="glass min-h-[200px] rounded-2xl p-4">
            <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase">{d}</div>
            {i % 2 === 0 && <div className="glass-strong rounded-xl px-2 py-1.5 text-xs">DSA · 1h</div>}
            {i % 3 === 0 && <div className="glass-strong mt-1.5 rounded-xl px-2 py-1.5 text-xs">DBMS · 45m</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
