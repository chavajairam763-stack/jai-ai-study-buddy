import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/assignments")({ component: Page });

function Page() {
  const items = [
    { title: "OS Assignment 3 — Scheduling", due: "Tomorrow", status: "In progress" },
    { title: "DBMS Case Study", due: "Fri", status: "Not started" },
    { title: "ML Lab Report", due: "Next week", status: "Draft" },
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><ClipboardList className="h-7 w-7 text-primary" /> Assignments</h1>
          <p className="mt-1 text-muted-foreground">Track and get AI help with your assignments.</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-sm"><Plus className="h-4 w-4" /> New</button>
      </div>
      <div className="space-y-2">
        {items.map((a) => (
          <div key={a.title} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div>
              <div className="font-semibold">{a.title}</div>
              <div className="text-xs text-muted-foreground">Due: {a.due}</div>
            </div>
            <span className="glass rounded-full px-3 py-1 text-xs">{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
