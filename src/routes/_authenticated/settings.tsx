import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings — JAI.AI" }] }),
});

function Settings() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [clearing, setClearing] = useState(false);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  const clearHistory = async () => {
    if (!confirm("Delete all your conversations and messages? This can't be undone.")) return;
    setClearing(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("chat_messages").delete().eq("user_id", data.user.id);
    await supabase.from("conversations").delete().eq("user_id", data.user.id);
    setClearing(false);
    toast.success("History cleared");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="glass rounded-2xl p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4 text-primary" /> Data</div>
        <p className="text-sm text-muted-foreground">Your chats, notes and bookmarks are stored in your private account. Only you can read them.</p>
        <button
          onClick={clearHistory}
          disabled={clearing}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" /> {clearing ? "Clearing…" : "Clear all conversations"}
        </button>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="mb-2 text-sm font-semibold">Session</div>
        <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">JAI.AI · One AI. Endless Possibilities.</p>
    </div>
  );
}
