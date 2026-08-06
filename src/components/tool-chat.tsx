import { useEffect, useRef, useState, useCallback } from "react";
import { Markdown } from "@/components/markdown";
import {
  Send, Copy, RefreshCw, Sparkles, Plus, Square, Bookmark, Share2,
  Maximize2, Baby, Download, Paperclip, Mic, Volume2, VolumeX, X, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tool } from "@/lib/tools";
import { ACCEPTED_FILE_TYPES, extractFileText } from "@/lib/file-text";
import {
  consumeOpen, getSession, historyBus, onOpenRequest, setSession, type Msg,
} from "@/lib/chat-store";

type Doc = { name: string; text: string };


export function ToolChat({ tool, extraContext }: { tool: Tool; extraContext?: string }) {
  const cached = getSession(tool.id);
  const [messages, setMessages] = useState<Msg[]>(cached.messages);
  const [conversationId, setConversationId] = useState<string | null>(cached.conversationId);
  const [input, setInput] = useState(cached.input);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [attaching, setAttaching] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userIdRef = useRef<string | null>(null);
  const stickRef = useRef(true);
  const docsRef = useRef<Doc[]>([]);
  docsRef.current = docs;


  // Typewriter buffers
  const fullRef = useRef("");
  const shownRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const streamDoneRef = useRef(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { userIdRef.current = data.user?.id ?? null; });
  }, []);

  /* Persist session so state survives navigation between tools */
  useEffect(() => {
    setSession(tool.id, { messages, conversationId, input });
  }, [tool.id, messages, conversationId, input]);

  /* Restore cached session when the tool changes */
  useEffect(() => {
    const s = getSession(tool.id);
    setMessages(s.messages);
    setConversationId(s.conversationId);
    setInput(s.input);
  }, [tool.id]);

  const loadConversation = useCallback(async (id: string | null) => {
    if (!id) {
      setMessages([]);
      setConversationId(null);
      return;
    }
    setRestoring(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("role,content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages(((data ?? []) as Msg[]).filter((m) => m.role === "user" || m.role === "assistant"));
    setConversationId(id);
    setRestoring(false);
  }, []);

  /* Sidebar asked us to open a conversation */
  useEffect(() => {
    const handle = () => {
      const req = consumeOpen(tool.id);
      if (req) void loadConversation(req.conversationId);
    };
    handle();
    return onOpenRequest(handle);
  }, [tool.id, loadConversation]);

  /* Smart auto-scroll: only stick to bottom when user is already near it */
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useEffect(() => {
    if (!stickRef.current) return;
    const el = scrollRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: loading ? "auto" : "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const ensureConversation = useCallback(async (firstUserText: string): Promise<string | null> => {
    if (conversationId) return conversationId;
    const uid = userIdRef.current;
    if (!uid) return null;
    const title = titleFrom(firstUserText);
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: uid, tool: tool.id, title })
      .select("id")
      .single();
    if (error || !data) return null;
    setConversationId(data.id);
    historyBus.emit();
    return data.id;
  }, [conversationId, tool.id]);

  const saveMessage = useCallback(async (convId: string, role: "user" | "assistant", content: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    await supabase.from("chat_messages").insert({ user_id: uid, conversation_id: convId, role, content });
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    historyBus.emit();
  }, []);

  /** rAF typewriter — reveals buffered tokens smoothly at ~60fps */
  const pumpTypewriter = useCallback(() => {
    if (rafRef.current) return;
    const tick = () => {
      const full = fullRef.current;
      const shown = shownRef.current;
      if (shown.length < full.length) {
        const remaining = full.length - shown.length;
        const step = Math.max(2, Math.ceil(remaining / 6));
        shownRef.current = full.slice(0, shown.length + step);
        const text = shownRef.current;
        setMessages((ms) => {
          const copy = ms.slice();
          copy[copy.length - 1] = { role: "assistant", content: text };
          return copy;
        });
      }
      if (!streamDoneRef.current || shownRef.current.length < fullRef.current.length) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setLoading(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const streamFrom = useCallback(async (history: Msg[], convId: string | null) => {
    setLoading(true);
    stickRef.current = true;
    setMessages([...history, { role: "assistant", content: "" }]);
    fullRef.current = "";
    shownRef.current = "";
    streamDoneRef.current = false;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const attached = docsRef.current
        .map((d) => `### File: ${d.name}\n\n${d.text.slice(0, 60000)}`)
        .join("\n\n---\n\n");
      const context = [extraContext, attached].filter(Boolean).join("\n\n---\n\n");
      const modelMessages = context
        ? [{ role: "user" as const, content: `Reference material:\n\n${context}` }, ...history]
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
      pumpTypewriter();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        fullRef.current += decoder.decode(value, { stream: true });
      }
      streamDoneRef.current = true;
      const acc = fullRef.current;
      if (convId && acc) await saveMessage(convId, "assistant", acc);
    } catch (err) {
      streamDoneRef.current = true;
      if ((err as Error).name === "AbortError") {
        // keep whatever streamed so far
        if (convId && fullRef.current) await saveMessage(convId, "assistant", fullRef.current);
        return;
      }
      const msg = err instanceof Error ? err.message : "Chat failed";
      toast.error(
        msg.includes("402") ? "AI credits exhausted. Please add credits to continue." :
        msg.includes("429") ? "Rate limited — try again in a moment." : msg,
      );
      setMessages((ms) => ms.slice(0, -1));
      setLoading(false);
    } finally {
      abortRef.current = null;
      if (streamDoneRef.current && shownRef.current.length >= fullRef.current.length) setLoading(false);
    }
  }, [tool.id, extraContext, saveMessage, pumpTypewriter]);

  const send = async (text: string) => {
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    const convId = await ensureConversation(text);
    if (convId) await saveMessage(convId, "user", text);
    await streamFrom(next, convId);
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    void send(text);
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

  const stop = () => {
    abortRef.current?.abort();
    streamDoneRef.current = true;
    fullRef.current = shownRef.current;
  };

  const newChat = () => {
    setMessages([]);
    setConversationId(null);
    setInput("");
    taRef.current?.focus();
  };

  const bookmark = async (content: string) => {
    const uid = userIdRef.current;
    if (!uid) return toast.error("Sign in to bookmark");
    const title = content.split("\n")[0].replace(/^#+\s*/, "").slice(0, 80).trim() || tool.label;
    const { error } = await supabase.from("bookmarks").insert({ user_id: uid, kind: "message", title, content });
    if (error) toast.error("Couldn't save"); else toast.success("Bookmarked");
  };

  const share = async (content: string) => {
    try {
      if (navigator.share) await navigator.share({ title: `JAI.AI · ${tool.label}`, text: content });
      else { await navigator.clipboard.writeText(content); toast.success("Copied"); }
    } catch { /* dismissed */ }
  };

  const exportMarkdown = () => {
    if (!messages.length) return;
    const md = [`# ${tool.label} — JAI.AI`, "", ...messages.map((m) =>
      m.role === "user" ? `## You\n\n${m.content}` : `## JAI.AI\n\n${m.content}`,
    )].join("\n\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jai-${tool.slug}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported");
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
          <div className="flex shrink-0 items-center gap-1.5">
            <button onClick={exportMarkdown} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors hover:bg-white/10" aria-label="Export conversation">
              <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={newChat} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors hover:bg-white/10" aria-label="New chat">
              <Plus className="h-3.5 w-3.5" /> New
            </button>
          </div>
        )}
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-5 overflow-y-auto pb-4 pr-1 [scrollbar-gutter:stable]">
        {restoring && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20" />)}
          </div>
        )}
        {!restoring && messages.length === 0 && (
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
                  onClick={() => void send(s)}
                  className="glass rounded-xl px-3 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:glow-sm"
                >{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          const streaming = loading && isLast && m.role === "assistant";
          return (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`min-w-0 max-w-[92%] sm:max-w-[85%] ${m.role === "user" ? "" : "w-full"}`}>
                {m.role === "user" ? (
                  <div className="whitespace-pre-wrap break-words rounded-2xl bg-gradient-primary px-4 py-2.5 text-sm text-primary-foreground shadow-lg [overflow-wrap:anywhere]">{m.content}</div>
                ) : (
                  <div className="space-y-2">
                    <div className="glass rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4">
                      {m.content ? (
                        <>
                          <Markdown content={m.content} />
                          {streaming && <span className="caret" aria-hidden />}
                        </>
                      ) : (
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
                        {isLast && (
                          <>
                            <IconBtn label="Expand answer" onClick={() => void send("Expand — give me the full, deep-dive explanation of that answer with background, details, edge cases, and Key takeaways.")}><Maximize2 className="h-3.5 w-3.5" /></IconBtn>
                            <IconBtn label="Explain simpler" onClick={() => void send("Explain simpler — rewrite that in plain, friendly language with a real-world analogy, no jargon, short sentences.")}><Baby className="h-3.5 w-3.5" /></IconBtn>
                          </>
                        )}
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
          <button type="button" onClick={stop} className="rounded-xl bg-white/10 p-2.5 text-foreground transition-colors hover:bg-white/20" aria-label="Stop"><Square className="h-4 w-4" /></button>
        ) : (
          <button disabled={!input.trim()} className="rounded-xl bg-gradient-primary p-2.5 text-primary-foreground glow-sm transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100" aria-label="Send"><Send className="h-4 w-4" /></button>
        )}
      </form>
    </div>
  );
}

/** Auto-generates a readable conversation title from the first message. */
function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").replace(/^["'`]+|["'`]+$/g, "").trim();
  const firstSentence = clean.split(/(?<=[.?!])\s/)[0] ?? clean;
  const base = (firstSentence.length > 8 ? firstSentence : clean).slice(0, 56).trim();
  const titled = base.charAt(0).toUpperCase() + base.slice(1);
  return (clean.length > 56 ? `${titled}…` : titled) || "New chat";
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick?: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="rounded-lg p-1.5 transition-colors hover:bg-white/10 hover:text-foreground">
      {children}
    </button>
  );
}
