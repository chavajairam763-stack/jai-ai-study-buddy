import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { Markdown } from "@/components/markdown";
import { Send, Copy, RefreshCw, ThumbsUp, ThumbsDown, Share2, Mic, Sparkles, Trash2, Square } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({ component: Chat });

type Msg = { role: "user" | "assistant"; content: string; liked?: boolean | null };

const SUGGESTIONS = [
  "Explain Bayes' theorem step by step with an example",
  "Write Python code for merge sort with comments",
  "Summarize Newton's laws in Telugu",
  "Solve: ∫ x² eˣ dx",
];

const STORAGE_KEY = "jai.chat.messages.v1";

function Chat() {
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))); } catch { /* quota */ }
  }, [messages]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  const streamFrom = useCallback(async (history: Msg[]) => {
    setLoading(true);
    setMessages([...history, { role: "assistant", content: "" }]);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((ms) => {
          const copy = ms.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Chat failed";
      toast.error(msg.includes("402") ? "AI credits exhausted. Please add credits to continue." : msg.includes("429") ? "Rate limited — try again in a moment." : msg);
      setMessages((ms) => ms.slice(0, -1));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, []);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setInput("");
    await streamFrom(next);
  };

  const regen = async () => {
    if (loading) return;
    let cut = messages.length;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") { cut = i; break; }
    }
    const trimmed = messages.slice(0, cut);
    if (!trimmed.length) return;
    await streamFrom(trimmed);
  };

  const stop = () => abortRef.current?.abort();

  const startVoice = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Voice input isn't supported on this browser.");
    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = false;
    r.onresult = (e: any) => setInput((v) => (v ? v + " " : "") + e.results[0][0].transcript);
    r.onerror = () => toast.error("Mic error. Please check permissions.");
    r.start();
  };

  const share = async (content: string) => {
    try {
      if (navigator.share) await navigator.share({ title: "JAI.AI answer", text: content });
      else { await navigator.clipboard.writeText(content); toast.success("Copied to clipboard"); }
    } catch { /* dismissed */ }
  };

  const react = (idx: number, val: boolean) => {
    setMessages((ms) => ms.map((m, i) => (i === idx ? { ...m, liked: m.liked === val ? null : val } : m)));
  };

  const clearAll = () => { setMessages([]); try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } };

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-4xl flex-col lg:h-[calc(100vh-8rem)]">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold sm:text-xl">AI Chat</h1>
          <p className="text-xs text-muted-foreground">English & Telugu · Math · Code · Streaming</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearAll} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs hover:bg-white/10" aria-label="Clear chat">
            <Trash2 className="h-3.5 w-3.5" /> New chat
          </button>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4 pr-1">
        {messages.length === 0 && (
          <div className="glass mx-auto mt-4 max-w-lg rounded-2xl p-6 text-center sm:mt-8 sm:p-8">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary glow-sm">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold">Ask JAI anything</h2>
            <p className="mt-1 text-sm text-muted-foreground">Doubts, code, essays, translations — in English or Telugu.</p>
            <div className="mt-5 grid gap-2 text-left">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); taRef.current?.focus(); }}
                  className="glass rounded-xl px-3 py-2 text-sm transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:glow-sm"
                >{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => {
          const isLastAssistant = i === messages.length - 1 && m.role === "assistant";
          const streaming = loading && isLastAssistant;
          return (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`min-w-0 max-w-[92%] sm:max-w-[85%] ${m.role === "user" ? "" : "w-full"}`}>
                {m.role === "user" ? (
                  <div className="whitespace-pre-wrap break-words rounded-2xl bg-gradient-primary px-4 py-2.5 text-sm text-primary-foreground shadow-lg [overflow-wrap:anywhere]">{m.content}</div>
                ) : (
                  <div className="space-y-2">
                    <div className="glass rounded-2xl px-4 py-3">
                      {m.content ? <Markdown content={m.content} /> : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                          JAI is thinking<span className="ml-1 inline-flex text-primary"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></span>
                        </div>
                      )}
                    </div>
                    {!streaming && m.content && (
                      <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                        <IconBtn label="Copy" onClick={() => { navigator.clipboard.writeText(m.content); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn label="Regenerate" onClick={regen}><RefreshCw className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn label="Share" onClick={() => share(m.content)}><Share2 className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn label="Like" onClick={() => react(i, true)} active={m.liked === true}><ThumbsUp className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn label="Dislike" onClick={() => react(i, false)} active={m.liked === false}><ThumbsDown className="h-3.5 w-3.5" /></IconBtn>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={submit} className="glass-strong sticky bottom-0 flex items-end gap-2 rounded-2xl border p-2">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Message JAI… (Shift+Enter for newline)"
          rows={1}
          aria-label="Message"
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button type="button" onClick={startVoice} className="rounded-lg p-2 text-muted-foreground hover:bg-white/10" aria-label="Voice input"><Mic className="h-4 w-4" /></button>
        {loading ? (
          <button type="button" onClick={stop} className="rounded-xl bg-white/10 p-2.5 text-foreground hover:bg-white/20" aria-label="Stop"><Square className="h-4 w-4" /></button>
        ) : (
          <button disabled={!input.trim()} className="rounded-xl bg-gradient-primary p-2.5 text-primary-foreground glow-sm transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100" aria-label="Send message"><Send className="h-4 w-4" /></button>
        )}
      </form>
    </div>
  );
}

function IconBtn({ children, onClick, label, active }: { children: React.ReactNode; onClick?: () => void; label: string; active?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className={`rounded-lg p-1.5 transition-colors ${active ? "bg-primary/20 text-primary" : "hover:bg-white/10"}`}>
      {children}
    </button>
  );
}
