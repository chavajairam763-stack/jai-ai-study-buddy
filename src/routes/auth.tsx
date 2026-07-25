import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Mail, Lock, Phone, ArrowRight, Eye, EyeOff } from "lucide-react";
import { friendlyAuthError } from "@/lib/auth-errors";
import { AuthMascot, type MascotState } from "@/components/auth-mascot";
import { AuthBackground } from "@/components/auth-background";

export const Route = createFileRoute("/auth")({
  component: Auth,
  head: () => ({
    meta: [
      { title: "Sign in — JAI.AI" },
      { name: "description", content: "Sign in to JAI.AI — one AI, endless possibilities." },
    ],
  }),
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
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mascot, setMascot] = useState<MascotState>("idle");
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  // Derive mascot state from focus + reveal + transient success/error handled inline.
  useEffect(() => {
    if (mascot === "success" || mascot === "error") return; // let those play out
    if (focused === "password") setMascot(showPassword ? "peek" : "password");
    else if (focused === "email") setMascot("email");
    else setMascot("idle");
  }, [focused, showPassword, mascot]);

  const flashError = () => {
    setMascot("error");
    window.setTimeout(() => setMascot("idle"), 900);
  };
  const flashSuccess = (then: () => void) => {
    setMascot("success");
    window.setTimeout(then, 900);
  };

  const emailProgress = Math.min(1, email.length / 24);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        if (data.session) {
          flashSuccess(() => { toast.success("Welcome to JAI.AI!"); navigate({ to: "/dashboard" }); });
        } else {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) {
            toast.success("Account created. Check your email to confirm, then sign in.");
            setMode("login");
          } else {
            flashSuccess(() => navigate({ to: "/dashboard" }));
          }
        }
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        flashSuccess(() => { toast.success("Signed in"); navigate({ to: "/dashboard" }); });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset email sent.");
        setMode("login");
      }
    } catch (err) {
      flashError();
      toast.error(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) { flashError(); toast.error(friendlyAuthError(res.error)); }
    else if (!res.redirected) flashSuccess(() => navigate({ to: "/dashboard" }));
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
        flashSuccess(() => navigate({ to: "/dashboard" }));
      }
    } catch (err) {
      flashError();
      toast.error(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <AuthBackground />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-4 flex justify-center"><Logo /></div>

        {/* Mascot sits above the card, half tucked in for premium framing */}
        <div className="relative -mb-10">
          <AuthMascot state={mascot} emailProgress={emailProgress} />
        </div>

        <motion.div
          layout
          className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
        >
          {/* Neon rim glow */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(120deg,rgba(212,175,55,0.25),transparent_40%,rgba(212,175,55,0.15))] opacity-60 [mask:linear-gradient(#000,transparent_60%)]" />

          <h1 className="relative text-2xl font-semibold tracking-tight">
            {mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset password" : mode === "phone" ? "Sign in with phone" : "Welcome back"}
          </h1>
          <p className="relative mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? "One AI. Endless possibilities." : "Continue your journey with JAI.AI"}
          </p>

          <AnimatePresence mode="wait">
            {mode === "phone" ? (
              <motion.form
                key="phone"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                onSubmit={handlePhone} className="relative mt-6 space-y-4"
              >
                <Field icon={Phone} type="tel" placeholder="+91 98765 43210" value={phone} onChange={setPhone} required />
                {otpSent && <Field icon={Lock} placeholder="Enter 6-digit OTP" value={otp} onChange={setOtp} required />}
                <SubmitBtn loading={loading}>{otpSent ? "Verify OTP" : "Send OTP"}</SubmitBtn>
                <button type="button" onClick={() => { setMode("login"); setOtpSent(false); }} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                  Back to email login
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="email"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                onSubmit={handleEmail} className="relative mt-6 space-y-4"
              >
                {mode === "signup" && (
                  <Field placeholder="Full name" value={name} onChange={setName} required />
                )}
                <Field
                  ref={emailRef}
                  icon={Mail}
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={setEmail}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused((f) => (f === "email" ? null : f))}
                  required
                />
                {mode !== "forgot" && (
                  <PasswordField
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword((s) => !s)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused((f) => (f === "password" ? null : f))}
                  />
                )}

                {mode === "login" && (
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-primary"
                      />
                      Remember me
                    </label>
                    <button type="button" onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-primary">
                      Forgot password?
                    </button>
                  </div>
                )}

                <SubmitBtn loading={loading}>
                  {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
                </SubmitBtn>
              </motion.form>
            )}
          </AnimatePresence>

          {mode !== "forgot" && mode !== "phone" && (
            <>
              <div className="relative my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-white/10" /> OR <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="relative grid gap-2">
                <button onClick={handleGoogle} className="group flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition-all hover:border-white/20 hover:bg-white/10">
                  <GoogleIcon /> Continue with Google
                </button>
                <button onClick={() => setMode("phone")} className="group flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition-all hover:border-white/20 hover:bg-white/10">
                  <Phone className="h-4 w-4" /> Continue with Phone
                </button>
              </div>
            </>
          )}

          <p className="relative mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>Already have an account? <button onClick={() => setMode("login")} className="font-semibold text-foreground hover:text-primary">Sign in</button></>
            ) : mode === "login" ? (
              <>New to JAI.AI? <button onClick={() => setMode("signup")} className="font-semibold text-foreground hover:text-primary">Sign up</button></>
            ) : mode === "forgot" ? (
              <button onClick={() => setMode("login")} className="font-semibold text-foreground hover:text-primary">Back to sign in</button>
            ) : null}
          </p>
        </motion.div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to home</Link>
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------------------- Fields -------------------------------- */

interface FieldProps {
  icon?: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  required?: boolean;
}
const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { icon: Icon, type = "text", placeholder, value, onChange, onFocus, onBlur, required },
  ref,
) {
  return (
    <div className="group relative">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
        className={`w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:bg-white/10 focus:shadow-[0_0_0_4px_rgba(212,175,55,0.12)] ${Icon ? "pl-10 pr-3" : "px-3"}`}
      />
    </div>
  );
});

function PasswordField({
  value, onChange, show, onToggle, onFocus, onBlur,
}: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
  onFocus: () => void; onBlur: () => void;
}) {
  return (
    <div className="group relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <input
        type={show ? "text" : "password"}
        placeholder="Password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        required
        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:bg-white/10 focus:shadow-[0_0_0_4px_rgba(212,175,55,0.12)]"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading}
      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#f7e7a8] via-primary to-[#8a6d1f] py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_-10px_rgba(212,175,55,0.6)] transition-all hover:shadow-[0_16px_40px_-10px_rgba(212,175,55,0.9)] disabled:opacity-60"
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative flex items-center gap-2">
        {loading ? "Please wait…" : (<>{children} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>)}
      </span>
    </motion.button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.2 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 13.9-5.4l-6.4-5.3C29.5 34.9 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8L6.2 32.9C9.5 39.4 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.4 5.3C41.5 34.9 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
  );
}
