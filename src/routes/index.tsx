import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Zap, Shield, Lock } from "lucide-react";
import { Logo } from "@/components/logo";
import { TOOL_LIST } from "@/lib/tools";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "JAI.AI — One AI. Endless Possibilities." },
      { name: "description", content: "A premium AI platform with seven expert assistants: chat, workspace, developer, research, calculator, automation, and market insight." },
      { property: "og:title", content: "JAI.AI — One AI. Endless Possibilities." },
      { property: "og:description", content: "Seven premium AI tools. One elegant workspace. Built by Jai Ram." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const ctaTo = signedIn ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-40 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#tools" className="hover:text-foreground">Tools</a>
            <a href="#why" className="hover:text-foreground">Why JAI.AI</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline">Login</Link>
            <Link to={ctaTo} className="rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-sm">
              {signedIn ? "Open app" : "Get started"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center md:px-6 md:pt-28">
        <div className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Seven expert AI tools in one workspace</span>
        </div>
        <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
          One AI.<br />
          <span className="text-gradient">Endless Possibilities.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
          JAI.AI brings together seven specialized assistants — chat, workspace, developer, research, calculator, automation and market insight — under one premium, private workspace.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={ctaTo} className="group inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow">
            {signedIn ? "Open JAI.AI" : "Start free"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a href="#tools" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold hover:bg-white/10">
            Explore tools
          </a>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Seven tools, <span className="text-gradient">one workspace</span></h2>
          <p className="mt-3 text-muted-foreground">Each tool has its own expert prompt, UI and workflow.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOL_LIST.map((t) => (
            <Link
              key={t.slug}
              to={ctaTo}
              className="glass group relative overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:glow-sm"
            >
              <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${t.accent} p-3 shadow-lg`}>
                <t.icon className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-lg font-semibold">{t.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-primary/70">{t.short}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Why */}
      <section id="why" className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature icon={Zap} title="Fast & streaming" desc="Answers stream as they're written. No spinners, no wait." />
          <Feature icon={Lock} title="Private by default" desc="Your chats and notes stay in your account. Only you can read them." />
          <Feature icon={Shield} title="Built by Jai Ram" desc="Crafted as a premium AI product, not a demo." />
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:px-6">
          <Logo />
          <div>© {new Date().getFullYear()} JAI.AI · One AI. Endless Possibilities.</div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="glass rounded-2xl p-6">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
