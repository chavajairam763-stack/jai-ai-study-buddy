import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chatWithJai } from "@/lib/ai.functions";
import ReactMarkdown from "react-markdown";
import { GraduationCap, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/exam")({ component: Exam });

function Exam() {
  const [subject, setSubject] = useState("Data Structures");
  const [type, setType] = useState("Semester");
  const [hours, setHours] = useState(10);
  const [difficulty, setDifficulty] = useState("Medium");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const send = useServerFn(chatWithJai);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await send({ data: { messages: [{ role: "user", content:
        `Create a personalized study plan for a ${type} exam in "${subject}". I have ${hours} hours available and want ${difficulty} difficulty. Include: (1) day-by-day schedule, (2) quick revision notes, (3) 5 important predicted questions, (4) 3 mock test questions with answers. Use markdown.` }] } });
      setPlan(res.text);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><GraduationCap className="h-7 w-7 text-primary" /> Exam Mode</h1>
        <p className="mt-1 text-muted-foreground">Personalized plan, revision notes, mock test — in one shot.</p>
      </div>
      <div className="glass grid gap-4 rounded-2xl p-6 sm:grid-cols-2">
        <Field label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} className={ip} /></Field>
        <Field label="Exam Type">
          <select value={type} onChange={(e) => setType(e.target.value)} className={ip}>
            <option>Semester</option><option>Mid-term</option><option>Unit test</option><option>Competitive</option>
          </select>
        </Field>
        <Field label="Study Time (hours)"><input type="number" min={1} max={200} value={hours} onChange={(e) => setHours(+e.target.value)} className={ip} /></Field>
        <Field label="Difficulty">
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={ip}>
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </Field>
        <button onClick={generate} disabled={loading} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground glow-sm disabled:opacity-50">
          <Sparkles className="h-4 w-4" /> {loading ? "Building your plan…" : "Generate Exam Plan"}
        </button>
      </div>
      {plan && (
        <div className="glass rounded-2xl p-6">
          <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{plan}</ReactMarkdown></div>
        </div>
      )}
    </div>
  );
}
const ip = "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/60";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1.5 text-xs text-muted-foreground">{label}</div>{children}</label>;
}
