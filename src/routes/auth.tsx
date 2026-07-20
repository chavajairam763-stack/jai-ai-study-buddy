import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Mail, Lock, Phone, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: Auth,
  head: () => ({ meta: [{ title: "Sign in — JAI.AI" }] }),
});

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "phone">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset email sent.");
        setMode("login");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message ?? "Google sign-in failed");
    else if (!res.redirected) navigate({ to: "/dashboard" });
  };

  const handlePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
        setOtpSent(true);
        toast.success("OTP sent to your phone.");
      } else {
        const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OTP error");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="glass-strong rounded-3xl p-7 glow-sm">
          <h1 className="text-2xl font-bold">
            {mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset password" : mode === "phone" ? "Sign in with phone" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? "Start learning smarter today" : "Continue your learning journey"}
          </p>

          {mode === "phone" ? (
            <form onSubmit={handlePhone} className="mt-6 space-y-4">
              <Field icon={Phone} type="tel" placeholder="+91 98765 43210" value={phone} onChange={setPhone} required />
              {otpSent && <Field icon={Lock} placeholder="Enter 6-digit OTP" value={otp} onChange={setOtp} required />}
              <SubmitBtn loading={loading}>{otpSent ? "Verify OTP" : "Send OTP"}</SubmitBtn>
              <button type="button" onClick={() => { setMode("login"); setOtpSent(false); }} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                Back to email login
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmail} className="mt-6 space-y-4">
              {mode === "signup" && (
                <Field placeholder="Full name" value={name} onChange={setName} required />
              )}
              <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} required />
              {mode !== "forgot" && (
                <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} required />
              )}
              {mode === "login" && (
                <button type="button" onClick={() => setMode("forgot")} className="block w-full text-right text-xs text-muted-foreground hover:text-foreground">
                  Forgot password?
                </button>
              )}
              <SubmitBtn loading={loading}>
                {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
              </SubmitBtn>
            </form>
          )}

          {mode !== "forgot" && mode !== "phone" && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-2">
                <button onClick={handleGoogle} className="glass flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium hover:bg-white/10">
                  <GoogleIcon /> Continue with Google
                </button>
                <button onClick={() => setMode("phone")} className="glass flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium hover:bg-white/10">
                  <Phone className="h-4 w-4" /> Continue with Phone
                </button>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>Already have an account? <button onClick={() => setMode("login")} className="font-semibold text-foreground hover:text-primary">Sign in</button></>
            ) : mode === "login" ? (
              <>New to JAI.AI? <button onClick={() => setMode("signup")} className="font-semibold text-foreground hover:text-primary">Sign up</button></>
            ) : mode === "forgot" ? (
              <button onClick={() => setMode("login")} className="font-semibold text-foreground hover:text-primary">Back to sign in</button>
            ) : null}
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, ...p }: { icon?: React.ComponentType<{ className?: string }>; type?: string; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
      <input
        type={p.type ?? "text"}
        placeholder={p.placeholder}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        required={p.required}
        className={`w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:bg-white/10 ${Icon ? "pl-10 pr-3" : "px-3"}`}
      />
    </div>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground glow-sm disabled:opacity-50">
      {loading ? "Please wait…" : (<>{children} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>)}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.2 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 13.9-5.4l-6.4-5.3C29.5 34.9 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8L6.2 32.9C9.5 39.4 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.4 5.3C41.5 34.9 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
  );
}
