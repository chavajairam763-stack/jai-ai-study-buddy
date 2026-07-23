import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: Profile,
  head: () => ({ meta: [{ title: "Profile — JAI.AI" }] }),
});

type ProfileForm = { name: string; email: string; college: string; branch: string; semester: string };

function Profile() {
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [stats, setStats] = useState<{ conversations: number; messages: number; notes: number; bookmarks: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      setUid(u.id);
      const [{ data: p }, c, m, n, b] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", u.id),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", u.id),
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", u.id),
        supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", u.id),
      ]);
      setForm({
        name: p?.name ?? u.user_metadata?.name ?? u.email?.split("@")[0] ?? "",
        email: u.email ?? "",
        college: p?.college ?? "",
        branch: p?.branch ?? "",
        semester: p?.semester ?? "",
      });
      setStats({ conversations: c.count ?? 0, messages: m.count ?? 0, notes: n.count ?? 0, bookmarks: b.count ?? 0 });
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !form) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: form.name, college: form.college, branch: form.branch, semester: form.semester,
    }).eq("id", uid);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };

  if (!form) return <div className="mx-auto max-w-3xl space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16" />)}</div>;

  const initial = form.name.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="glass relative overflow-hidden rounded-3xl p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground glow-sm">{initial}</div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{form.name || "Your profile"}</h1>
            <p className="truncate text-sm text-muted-foreground">{form.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Conversations" value={stats?.conversations ?? 0} />
        <Metric label="Messages" value={stats?.messages ?? 0} />
        <Metric label="Notes" value={stats?.notes ?? 0} />
        <Metric label="Bookmarks" value={stats?.bookmarks ?? 0} />
      </div>

      <form onSubmit={save} className="glass space-y-4 rounded-2xl p-6">
        <h2 className="font-semibold">Details</h2>
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="College" value={form.college} onChange={(v) => setForm({ ...form, college: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Branch" value={form.branch} onChange={(v) => setForm({ ...form, branch: v })} />
          <Field label="Semester" value={form.semester} onChange={(v) => setForm({ ...form, semester: v })} />
        </div>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-sm disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 focus:bg-white/10"
      />
    </label>
  );
}
