import { createFileRoute } from "@tanstack/react-router";
import { Settings as SIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({ component: Page });

function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><SIcon className="h-7 w-7 text-primary" /> Settings</h1>
        <p className="mt-1 text-muted-foreground">Personalize your JAI.AI experience.</p>
      </div>
      {[
        { title: "Theme", desc: "Dark mode is on by default." },
        { title: "Language", desc: "English / Telugu" },
        { title: "Notifications", desc: "Daily study reminders" },
      ].map((s) => (
        <div key={s.title} className="glass flex items-center justify-between rounded-2xl p-5">
          <div>
            <div className="font-semibold">{s.title}</div>
            <div className="text-xs text-muted-foreground">{s.desc}</div>
          </div>
          <div className="h-6 w-11 rounded-full bg-gradient-primary glow-sm" />
        </div>
      ))}
    </div>
  );
}
