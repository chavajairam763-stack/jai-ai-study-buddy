import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chatWithJai } from "@/lib/ai.functions";
import ReactMarkdown from "react-markdown";
import { Sparkles, Download, Languages } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notes")({ component: Notes });

function Notes() {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "te">("en");
  const send = useServerFn(chatWithJai);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const prompt = lang === "te"
        ? `Generate concise, well-structured study notes in Telugu for the topic: "${topic}". Use markdown with headings, bullet points, and key formulas.`
        : `Generate concise, well-structured study notes in English for the topic: "${topic}". Use markdown with headings, bullet points, and key formulas.`;
      const res = await send({ data: { messages: [{ role: "user", content: prompt }] } });
      setNotes(res.text);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setLoading(false); }
  };

  const download = () => {
    const blob = new Blob([notes], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${topic || "notes"}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Smart Notes</h1>
        <p className="mt-1 text-muted-foreground">Generate, summarize, translate, and export study notes.</p>
      </div>
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap gap-2">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter any topic (e.g. Kirchhoff's laws)"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary/60" />
          <button onClick={() => setLang(lang === "en" ? "te" : "en")} className="glass flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs"><Languages className="h-3.5 w-3.5" /> {lang === "en" ? "EN" : "TE"}</button>
          <button onClick={generate} disabled={loading} className="rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground glow-sm disabled:opacity-50">
            {loading ? "Generating…" : (<span className="inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Generate</span>)}
          </button>
        </div>
      </div>
      {notes && (
        <div className="glass rounded-2xl p-6">
          <div className="mb-3 flex justify-end">
            <button onClick={download} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Download .md</button>
          </div>
          <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{notes}</ReactMarkdown></div>
        </div>
      )}
    </div>
  );
}
