import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageSquare, FileText, StickyNote, BookOpen, GraduationCap,
  Layers, ClipboardList, CalendarDays, Mic, ScanLine, FileUser, Code2,
  Lightbulb, Sparkles, ArrowRight, Play,
} from "lucide-react";
import { Logo, jaiRobot } from "@/components/logo";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "JAI.AI — Study Smarter, Not Harder" },
      { name: "description", content: "Your personal AI study partner. Chat, analyze PDFs, generate notes, master exams." },
    ],
  }),
});

const orbitIcons = [
  { icon: MessageSquare, label: "AI Chat" },
  { icon: FileText, label: "PDF" },
  { icon: StickyNote, label: "Notes" },
  { icon: BookOpen, label: "Papers" },
  { icon: GraduationCap, label: "Quiz" },
  { icon: Lightbulb, label: "Exam" },
];

const features = [
  { icon: MessageSquare, title: "AI Chat", desc: "ChatGPT-style tutor in Telugu & English.", color: "from-fuchsia-500 to-purple-600" },
  { icon: Lightbulb, title: "Problem Solver", desc: "Step-by-step math, science & coding.", color: "from-amber-400 to-orange-500" },
  { icon: FileText, title: "PDF Analysis", desc: "Upload a PDF, ask any question.", color: "from-sky-400 to-blue-600" },
  { icon: StickyNote, title: "Notes Generator", desc: "Turn topics into structured notes.", color: "from-emerald-400 to-teal-600" },
  { icon: BookOpen, title: "Previous Papers", desc: "By branch, semester, subject, year.", color: "from-rose-400 to-pink-600" },
  { icon: GraduationCap, title: "Exam Mode", desc: "Personalized plan + mock tests.", color: "from-violet-500 to-indigo-600" },
  { icon: Layers, title: "Flashcards", desc: "Auto-generated spaced repetition cards.", color: "from-cyan-400 to-blue-500" },
  { icon: ClipboardList, title: "Assignments", desc: "Drafting, checking, formatting help.", color: "from-lime-400 to-green-600" },
  { icon: CalendarDays, title: "Study Planner", desc: "Daily goals & smart schedules.", color: "from-yellow-400 to-orange-500" },
  { icon: Mic, title: "Voice Assistant", desc: "Ask by voice, hear the answer.", color: "from-pink-400 to-rose-600" },
  { icon: ScanLine, title: "OCR Scanner", desc: "Scan handwritten notes to text.", color: "from-teal-400 to-cyan-600" },
  { icon: FileUser, title: "Resume Builder", desc: "Craft a student-ready resume.", color: "from-purple-400 to-fuchsia-600" },
  { icon: Code2, title: "Coding Assistant", desc: "Debug, explain and generate code.", color: "from-indigo-400 to-purple-600" },
];

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="glass sticky top-0 z-40 border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#home" className="hover:text-foreground">Home</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline">Login</Link>
            <Link to="/auth" className="rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-sm">Sign Up</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="glass mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Powered by Lovable AI · Free for students</span>
          </div>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Study Smarter,<br />
            <span className="text-gradient">Not Harder.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
            JAI.AI is your personal AI study partner. Learn, solve doubts, summarize PDFs, generate notes,
            and prepare for exams — all in one premium workspace.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/auth" className="group inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow">
              Start Learning Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/chat" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold hover:bg-white/10">
              <Play className="h-4 w-4" /> Try AI Chat
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              {["#a78bfa", "#f472b6", "#60a5fa", "#34d399", "#fbbf24"].map((c, i) => (
                <div key={i} className="h-9 w-9 rounded-full border-2 border-background" style={{ background: `linear-gradient(135deg, ${c}, #7c3aed)` }} />
              ))}
            </div>
            <div className="text-sm">
              <div className="font-semibold">10,000+ students</div>
              <div className="text-muted-foreground">Loved by learners across India</div>
            </div>
          </div>
        </div>

        {/* Robot + orbit */}
        <div className="relative mx-auto aspect-square w-full max-w-[520px]">
          <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-30 blur-3xl animate-pulse-glow" />
          <div className="absolute inset-8 rounded-full border border-white/10" />
          <div className="absolute inset-16 rounded-full border border-white/10" />
          <div className="absolute inset-24 rounded-full border border-white/10" />
          <img src={jaiRobot} alt="JAI robot" width={520} height={520} className="relative z-10 mx-auto h-full w-full animate-float object-contain" />
          {orbitIcons.map((o, i) => {
            const angle = (i / orbitIcons.length) * 360;
            return (
              <div
                key={o.label}
                className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
                style={{ transform: `translate(-50%,-50%) rotate(${angle}deg) translateY(-45%) rotate(-${angle}deg)` }}
              >
                <div className="glass-strong flex items-center gap-2 rounded-full px-3 py-2 glow-sm">
                  <o.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">{o.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Everything you need to <span className="text-gradient">ace college</span></h2>
          <p className="mt-3 text-muted-foreground">13 premium tools designed for students, engineered for focus.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="glass group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1 hover:glow-sm">
              <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${f.color} p-2.5 shadow-lg`}>
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-primary/20 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-5xl px-4 py-20 md:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Simple <span className="text-gradient">pricing</span></h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="glass rounded-2xl p-8">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-1 text-sm text-muted-foreground">Everything a student needs.</p>
            <div className="mt-6 text-4xl font-bold">₹0</div>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>✓ AI Chat (English + Telugu)</li>
              <li>✓ PDF Analysis & Notes</li>
              <li>✓ Previous Papers</li>
              <li>✓ Study Planner & Flashcards</li>
            </ul>
            <Link to="/auth" className="mt-6 inline-flex w-full items-center justify-center rounded-full glass-strong px-6 py-3 text-sm font-semibold">Get started</Link>
          </div>
          <div className="glass relative overflow-hidden rounded-2xl border border-primary/40 p-8 glow-sm">
            <div className="absolute right-4 top-4 rounded-full bg-gradient-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Popular</div>
            <h3 className="text-lg font-semibold">Pro</h3>
            <p className="mt-1 text-sm text-muted-foreground">Unlimited AI power.</p>
            <div className="mt-6 text-4xl font-bold">₹199<span className="text-base text-muted-foreground">/mo</span></div>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>✓ Everything in Free</li>
              <li>✓ Unlimited AI messages</li>
              <li>✓ Priority exam mode</li>
              <li>✓ Advanced OCR + Voice</li>
            </ul>
            <Link to="/auth" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow-sm">Upgrade to Pro</Link>
          </div>
        </div>
      </section>

      {/* About / Contact */}
      <section id="about" className="mx-auto max-w-4xl px-4 py-20 text-center md:px-6">
        <h2 className="text-3xl font-bold md:text-4xl">Built by students, <span className="text-gradient">for students</span></h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          JAI.AI blends the clarity of Linear, the calm of Apple, the depth of Notion and the intelligence of modern AI —
          into a study companion that actually helps you learn.
        </p>
      </section>

      <footer id="contact" className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:px-6">
          <Logo />
          <div>© {new Date().getFullYear()} JAI.AI · hello@jai.ai</div>
        </div>
      </footer>
    </div>
  );
}
