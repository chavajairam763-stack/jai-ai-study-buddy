import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/reset-password")({ component: Reset });

function Reset() {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    nav({ to: "/dashboard" });
  };
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="glass-strong w-full max-w-md rounded-3xl p-7 glow-sm">
        <div className="mb-4 flex justify-center"><Logo /></div>
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password"
          className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-primary/60" />
        <button disabled={loading} className="mt-4 w-full rounded-full bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground glow-sm disabled:opacity-50">
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
