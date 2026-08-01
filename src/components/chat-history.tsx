import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, MessageSquare, Pencil, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TOOLS, type ToolId } from "@/lib/tools";
import { historyBus, requestOpen } from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Conversation = { id: string; title: string; tool: ToolId; updated_at: string };

export function ChatHistory({ onNavigate }: { onNavigate?: () => void }) {
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setItems([]); return; }
    const { data } = await supabase
      .from("conversations")
      .select("id,title,tool,updated_at")
      .eq("user_id", auth.user.id)
      .order("updated_at", { ascending: false })
      .limit(40);
    setItems((data ?? []) as Conversation[]);
  }, []);

  useEffect(() => {
    void load();
    return historyBus.on(() => { void load(); });
  }, [load]);

  const open = (c: Conversation) => {
    setActiveId(c.id);
    const tool = TOOLS[c.tool] ?? TOOLS.chat;
    requestOpen(tool.id, c.id);
    onNavigate?.();
    void navigate({ to: `/${tool.slug}` });
  };

  const rename = async (id: string) => {
    const title = draft.trim().slice(0, 80);
    if (!title) return setEditing(null);
    setItems((it) => (it ?? []).map((c) => (c.id === id ? { ...c, title } : c)));
    setEditing(null);
    const { error } = await supabase.from("conversations").update({ title }).eq("id", id);
    if (error) { toast.error("Couldn't rename"); void load(); }
  };

  const remove = async (id: string) => {
    setItems((it) => (it ?? []).filter((c) => c.id !== id));
    await supabase.from("chat_messages").delete().eq("conversation_id", id);
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) { toast.error("Couldn't delete"); void load(); return; }
    toast.success("Chat deleted");
  };

  const filtered = (items ?? []).filter((c) =>
    !q.trim() || c.title.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="mt-4">
      <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        Chat history
      </div>

      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search chats"
          aria-label="Search chats"
          className="w-full rounded-xl border border-white/5 bg-white/[0.03] py-2 pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-white/[0.06]"
        />
      </div>

      <div className="max-h-64 space-y-0.5 overflow-y-auto pr-0.5">
        {items === null && Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton mb-1 h-8" />)}
        {items !== null && filtered.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground/70">
            {q ? "No chats match that search." : "No chats yet — start one from any tool."}
          </p>
        )}
        {filtered.map((c) => {
          const tool = TOOLS[c.tool] ?? TOOLS.chat;
          const Icon = tool.icon ?? MessageSquare;
          const isEditing = editing === c.id;
          return (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs transition-all duration-200",
                activeId === c.id
                  ? "bg-white/[0.08] text-foreground"
                  : "text-muted-foreground hover:translate-x-0.5 hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              {isEditing ? (
                <>
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void rename(c.id);
                      if (e.key === "Escape") setEditing(null);
                    }}
                    aria-label="Chat title"
                    className="min-w-0 flex-1 rounded-md bg-white/10 px-1.5 py-0.5 outline-none"
                  />
                  <button onClick={() => void rename(c.id)} aria-label="Save title" className="rounded p-1 hover:bg-white/10"><Check className="h-3 w-3" /></button>
                  <button onClick={() => setEditing(null)} aria-label="Cancel rename" className="rounded p-1 hover:bg-white/10"><X className="h-3 w-3" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => open(c)} className="min-w-0 flex-1 truncate text-left">{c.title}</button>
                  <span className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      onClick={() => { setEditing(c.id); setDraft(c.title); }}
                      aria-label={`Rename ${c.title}`}
                      className="rounded p-1 hover:bg-white/10"
                    ><Pencil className="h-3 w-3" /></button>
                    <button
                      onClick={() => void remove(c.id)}
                      aria-label={`Delete ${c.title}`}
                      className="rounded p-1 hover:bg-white/10 hover:text-destructive"
                    ><Trash2 className="h-3 w-3" /></button>
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
