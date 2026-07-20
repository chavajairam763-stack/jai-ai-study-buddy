import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { chatWithJai } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { Send, Copy, RefreshCw, ThumbsUp, ThumbsDown, Paperclip, Mic, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({ component: Chat });

type Msg = { role: "user" | "assistant"; content: string };

function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const send = useServerFn(chatWithJai);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await send({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: res.text }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chat failed");
      setMessages(next);
    } finally { setLoading(false); }
  };

  const regen = async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const trimmed = messages.slice(0, messages.lastIndexOf(messages.filter((m) => m.role === "assistant").pop() ?? messages[0]));
    setMessages(trimmed);
    setLoading(true);
    try {
      const res = await send({ data: { messages: trimmed } });
      setMessages([...trimmed, { role: "assistant", content: res.text }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chat failed");
    } finally { setLoading(false); }
  };

  const startVoice = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Voice input not supported here");
    const r = new SR();
    r.lang = "en-IN"; r.interimResults = false;
    r.onresult = (e: any) => setInput((v) => (v ? v + " " : "") + e.results[0][0].transcript);
    r.onerror = () => toast.error("Mic error");
    r.start();
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="glass mx-auto mt-10 max-w-lg rounded-2xl p-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary glow-sm"><Sparkles className="h-7 w-7 text-primary-foreground" /></div>
            <h2 className="text-xl font-bold">Ask JAI anything</h2>
            <p className="mt-1 text-sm text-muted-foreground">Doubts, code, essays, translations — in English or Telugu.</p>
            <div className="mt-5 grid gap-2 text-left">
              {["Explain Bayes' theorem step by step", "Write Python code for merge sort", "Summarize Newton's laws in Telugu"].map((s) => (
                <button key={s} onClick={() => setInput(s)} className="glass rounded-xl px-3 py-2 text-sm hover:bg-white/10">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] ${m.role === "user" ? "" : "w-full"}`}>
              {m.role === "user" ? (
                <div className="rounded-2xl bg-gradient-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div>
              ) : (
                <div className="space-y-2">
                  <div className="prose prose-sm prose-invert max-w-none text-foreground">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <IconBtn onClick={() => { navigator.clipboard.writeText(m.content); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn onClick={regen}><RefreshCw className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn><ThumbsUp className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn><ThumbsDown className="h-3.5 w-3.5" /></IconBtn>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="h-4 w-4 animate-pulse text-primary" /> JAI is thinking…</div>
        )}
      </div>
      <form onSubmit={submit} className="glass-strong sticky bottom-0 flex items-end gap-2 rounded-2xl border p-2">
        <button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-white/10" aria-label="Attach"><Paperclip className="h-4 w-4" /></button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Message JAI…"
          rows={1}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button type="button" onClick={startVoice} className="rounded-lg p-2 text-muted-foreground hover:bg-white/10" aria-label="Voice"><Mic className="h-4 w-4" /></button>
        <button disabled={loading || !input.trim()} className="rounded-xl bg-gradient-primary p-2.5 text-primary-foreground glow-sm disabled:opacity-50" aria-label="Send"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} className="rounded-lg p-1.5 hover:bg-white/10">{children}</button>;
}
