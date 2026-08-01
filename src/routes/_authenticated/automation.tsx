import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ToolChat } from "@/components/tool-chat";
import { TOOLS } from "@/lib/tools";
import { toast } from "sonner";
import {
  Workflow, Plus, Play, Pause, Trash2, Pencil, X, Clock, Zap, Sparkles, ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/automation")({
  component: AutomationPage,
  head: () => ({
    meta: [
      { title: "AI Automation — JAI.AI" },
      { name: "description", content: "Build, schedule and manage your automation workflows with JAI.AI." },
    ],
  }),
});

type Automation = {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  schedule: string;
  steps: string[];
  status: string;
  last_run_at: string | null;
  run_count: number;
  updated_at: string;
};

const TRIGGERS = ["schedule", "manual", "webhook"] as const;
const SCHEDULES = ["hourly", "daily", "weekly", "monthly"] as const;

const BLANK = {
  name: "",
  description: "",
  trigger_type: "schedule",
  schedule: "daily",
  stepsText: "",
};

function AutomationPage() {
  const [tab, setTab] = useState<"flows" | "assistant">("flows");

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 glow-sm">
            <Workflow className="h-5 w-5 text-black" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-xl">AI Automation</h1>
            <p className="truncate text-xs text-muted-foreground">Design workflows, then let JAI help you build them.</p>
          </div>
        </div>
        <div className="glass flex rounded-full p-1 text-xs">
          {(["flows", "assistant"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium capitalize transition-all",
                tab === t ? "bg-gradient-primary text-primary-foreground glow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >{t === "flows" ? "My workflows" : "AI assistant"}</button>
          ))}
        </div>
      </div>

      {tab === "flows" ? <Flows /> : <ToolChat tool={TOOLS.automation} />}
    </div>
  );
}

function Flows() {
  const [items, setItems] = useState<Automation[] | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK });

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setItems([]); return; }
    const { data, error } = await supabase
      .from("automations")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("updated_at", { ascending: false });
    if (error) { toast.error("Couldn't load automations"); setItems([]); return; }
    setItems((data ?? []).map((r) => ({
      ...r,
      steps: Array.isArray(r.steps) ? (r.steps as string[]) : [],
    })) as Automation[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openNew = () => { setEditingId(null); setForm({ ...BLANK }); setEditorOpen(true); };
  const openEdit = (a: Automation) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      description: a.description,
      trigger_type: a.trigger_type,
      schedule: a.schedule,
      stepsText: a.steps.join("\n"),
    });
    setEditorOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) return toast.error("Give your automation a name");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const payload = {
      name,
      description: form.description.trim(),
      trigger_type: form.trigger_type,
      schedule: form.schedule,
      steps: form.stepsText.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    const { error } = editingId
      ? await supabase.from("automations").update(payload).eq("id", editingId)
      : await supabase.from("automations").insert({ ...payload, user_id: auth.user.id });
    if (error) return toast.error("Couldn't save automation");
    toast.success(editingId ? "Automation updated" : "Automation created");
    setEditorOpen(false);
    void load();
  };

  const toggle = async (a: Automation) => {
    const status = a.status === "active" ? "paused" : "active";
    setItems((it) => (it ?? []).map((x) => (x.id === a.id ? { ...x, status } : x)));
    const { error } = await supabase.from("automations").update({ status }).eq("id", a.id);
    if (error) { toast.error("Couldn't update"); void load(); }
  };

  const runNow = async (a: Automation) => {
    const patch = { last_run_at: new Date().toISOString(), run_count: a.run_count + 1 };
    setItems((it) => (it ?? []).map((x) => (x.id === a.id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("automations").update(patch).eq("id", a.id);
    if (error) { toast.error("Couldn't log run"); void load(); return; }
    toast.success(`Logged a run of “${a.name}”`);
  };

  const remove = async (a: Automation) => {
    setItems((it) => (it ?? []).filter((x) => x.id !== a.id));
    const { error } = await supabase.from("automations").delete().eq("id", a.id);
    if (error) { toast.error("Couldn't delete"); void load(); return; }
    toast.success("Automation deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {items === null ? "Loading…" : `${items.length} workflow${items.length === 1 ? "" : "s"}`}
        </p>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground glow-sm transition-transform hover:scale-[1.03]">
          <Plus className="h-3.5 w-3.5" /> New automation
        </button>
      </div>

      {items === null && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36" />)}
        </div>
      )}

      {items !== null && items.length === 0 && (
        <div className="glass rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-primary" />
          <p className="text-sm font-medium">No automations yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create your first workflow, or ask the AI assistant to design one for you.</p>
          <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground glow-sm">
            <Plus className="h-3.5 w-3.5" /> Create automation
          </button>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((a) => (
            <article key={a.id} className="glass group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:glow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{a.name}</h3>
                  {a.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.description}</p>}
                </div>
                <span className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                  a.status === "active" ? "bg-primary/15 text-primary" : "bg-white/10 text-muted-foreground",
                )}>{a.status}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1"><Zap className="h-3 w-3" />{a.trigger_type}</span>
                {a.trigger_type === "schedule" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1"><Clock className="h-3 w-3" />{a.schedule}</span>
                )}
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1"><ListChecks className="h-3 w-3" />{a.steps.length} step{a.steps.length === 1 ? "" : "s"}</span>
              </div>

              {a.steps.length > 0 && (
                <ol className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {a.steps.slice(0, 3).map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">{i + 1}</span>
                      <span className="truncate">{s}</span>
                    </li>
                  ))}
                  {a.steps.length > 3 && <li className="pl-6 text-[11px] opacity-70">+{a.steps.length - 3} more</li>}
                </ol>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[11px] text-muted-foreground/70">
                  {a.run_count > 0 ? `Ran ${a.run_count}× · last ${new Date(a.last_run_at!).toLocaleDateString()}` : "Never run"}
                </span>
                <div className="flex items-center gap-1">
                  <Act label="Run now" onClick={() => void runNow(a)}><Play className="h-3.5 w-3.5" /></Act>
                  <Act label={a.status === "active" ? "Pause" : "Activate"} onClick={() => void toggle(a)}>
                    {a.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-primary" />}
                  </Act>
                  <Act label="Edit" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Act>
                  <Act label="Delete" onClick={() => void remove(a)}><Trash2 className="h-3.5 w-3.5" /></Act>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 backdrop-blur-sm sm:place-items-center" onClick={() => setEditorOpen(false)}>
          <div
            className="glass-strong max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl p-6 animate-in slide-in-from-bottom-4 duration-300 sm:max-w-lg sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? "Edit automation" : "New automation"}</h2>
              <button onClick={() => setEditorOpen(false)} aria-label="Close" className="rounded-lg p-1.5 hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3">
              <Field label="Name">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Weekly report digest" className={inputCls} />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What should this automation accomplish?" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Trigger">
                  <select value={form.trigger_type} onChange={(e) => setForm({ ...form, trigger_type: e.target.value })} className={inputCls}>
                    {TRIGGERS.map((t) => <option key={t} value={t} className="bg-black capitalize">{t}</option>)}
                  </select>
                </Field>
                <Field label="Schedule">
                  <select value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} disabled={form.trigger_type !== "schedule"} className={cn(inputCls, form.trigger_type !== "schedule" && "opacity-40")}>
                    {SCHEDULES.map((s) => <option key={s} value={s} className="bg-black capitalize">{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Steps (one per line)">
                <textarea value={form.stepsText} onChange={(e) => setForm({ ...form, stepsText: e.target.value })} rows={5} placeholder={"Fetch new rows from the sheet\nSummarize with JAI.AI\nEmail the digest"} className={cn(inputCls, "font-mono text-xs")} />
              </Field>
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={() => setEditorOpen(false)} className="glass flex-1 rounded-xl py-2.5 text-sm hover:bg-white/10">Cancel</button>
              <button onClick={() => void save()} className="flex-1 rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground glow-sm">
                {editingId ? "Save changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Act({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground">
      {children}
    </button>
  );
}
