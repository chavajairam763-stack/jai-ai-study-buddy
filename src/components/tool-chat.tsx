import { useEffect, useRef, useState, useCallback } from "react";
import { Markdown } from "@/components/markdown";
import { Send, Copy, RefreshCw, Sparkles, Trash2, Square, Bookmark, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tool } from "@/lib/tools";

type Msg = { role: "user" | "assistant"; content: string };

export function ToolChat({ tool, extraContext }: { tool: Tool; extraContext?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { userIdRef.current = data.user?.id ?? null; });
  }, []);

  // Reset when tool changes
  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    setInput("");
  }, [tool.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  const ensureConversation = useCallback(async (firstUserText: string): Promise<string | null> => {
    if (conversationId) return conversationId;
    const uid = userIdRef.current;
    if (!uid) return null;
    const title = firstUserText.slice(0, 60).replace(/\s+/g, " ").trim() || "New chat";
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: uid, tool: tool.id, title })
      .select("id")
      .single();
    if (error || !data) return null;
    setConversationId(data.id);
    return data.id;
  }, [conversationId, tool.id]);

  const saveMessage = useCallback(async (convId: string, role: "user" | "assistant", content: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    await supabase.from("chat_messages").insert({
      user_id: uid, conversation_id: convId, role, content,
    });
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
  }, []);

  const streamFrom = useCallback(async (history: Msg[], convId: string | null) => {
    setLoading(true);
    setMessages([...history, { role: "assistant", content: "" }]);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const modelMessages = extraContext
        ? [{ role: "user" as const, content: `Reference material:\n\n${extraContext}` }, ...history]
        : history;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tool: tool.id, messages: modelMessages.map(({ role, content }) => ({ role, content })) }),
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
      if (convId && acc) await saveMessage(convId, "assistant", acc);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Chat failed";
      toast.error(
        msg.includes("402") ? "AI credits exhausted. Please add credits to continue." :
        msg.includes("429") ? "Rate limited — try again in a moment." : msg,
      );
      setMessages((ms) => ms.slice(0, -1));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [tool.id, extraContext, saveMessage]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setInput("");
    const convId = await ensureConversation(text);
    if (convId) await saveMessage(convId, "user", text);
    await streamFrom(next, convId);
  };

  const regen = async () => {
    if (loading) return;
    let cut = messages.length;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") { cut = i; break; }
    }
    const trimmed = messages.slice(0, cut);
    if (!trimmed.length) return;
    await streamFrom(trimmed, conversationId);
  };

  const stop = () => abortRef.current?.abort();

  const clearAll = () => { setMessages([]); setConversationId(null); };

  const bookmark = async (content: string) => {
    const uid = userIdRef.current;
    if (!uid) return toast.error("Sign in to bookmark");
    const title = content.split("\n")[0].slice(0, 80).trim() || tool.label;
    const { error } = await supabase.from("bookmarks").insert({
      user_id: uid, kind: "message", title, content,
    });
    if (error) toast.error("Couldn't save"); else toast.success("Bookmarked");
  };

  const share = async (content: string) => {
    try {
      if (navigator.share) await navigator.share({ title: `JAI.AI · ${tool.label}`, text: content });
      else { await navigator.clipboard.writeText(content); toast.success("Copied"); }
    } catch { /* dismissed */ }
  };

  const Icon = tool.icon;

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-4xl flex-col lg:h-[calc(100vh-8rem)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tool.accent} glow-sm`}>
            <Icon className="h-5 w-5 text-black" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-xl">{tool.label}</h1>
            <p className="truncate text-xs text-muted-foreground">{tool.tagline}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearAll} className="glass flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs hover:bg-white/10" aria-label="New chat">
            <Trash2 className="h-3.5 w-3.5" /> New
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4 pr-1">
        {messages.length === 0 && (
          <div className="glass mx-auto mt-4 max-w-lg rounded-2xl p-6 text-center sm:mt-8 sm:p-8">
            <div className={`mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${tool.accent} glow-sm`}>
              <Icon className="h-7 w-7 text-black" />
            </div>
            <h2 className="text-xl font-bold">{tool.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tool.tagline}</p>
            <div className="mt-5 grid gap-2 text-left">
              {tool.suggestions.map((s) => (
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
                          Thinking<span className="ml-1 inline-flex text-primary"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></span>
                        </div>
                      )}
                    </div>
                    {!streaming && m.content && (
                      <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                        <IconBtn label="Copy" onClick={() => { navigator.clipboard.writeText(m.content); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn label="Regenerate" onClick={regen}><RefreshCw className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn label="Bookmark" onClick={() => bookmark(m.content)}><Bookmark className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn label="Share" onClick={() => share(m.content)}><Share2 className="h-3.5 w-3.5" /></IconBtn>
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
          placeholder={tool.placeholder}
          rows={1}
          aria-label="Message"
          className="max-h-48 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        {loading ? (
          <button type="button" onClick={stop} className="rounded-xl bg-white/10 p-2.5 text-foreground hover:bg-white/20" aria-label="Stop"><Square className="h-4 w-4" /></button>
        ) : (
          <button disabled={!input.trim()} className="rounded-xl bg-gradient-primary p-2.5 text-primary-foreground glow-sm transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100" aria-label="Send"><Send className="h-4 w-4" /></button>
        )}
      </form>
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick?: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
      {children}
    </button>
  );
}
