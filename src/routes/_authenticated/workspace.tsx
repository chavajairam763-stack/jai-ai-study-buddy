import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ToolChat } from "@/components/tool-chat";
import { TOOLS } from "@/lib/tools";
import { Upload, FileText, X, Download, StickyNote, Loader2, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { extractFileText, ACCEPTED_FILE_TYPES } from "@/lib/file-text";

export const Route = createFileRoute("/_authenticated/workspace")({
  component: Workspace,
  head: () => ({
    meta: [
      { title: "AI Workspace — PDF, OCR & Notes | JAI.AI" },
      { name: "description", content: "Read PDFs, run OCR on images, highlight passages and turn them into saved notes with AI summaries." },
      { property: "og:title", content: "AI Workspace — JAI.AI" },
      { property: "og:description", content: "PDF reading, OCR, highlights, notes and exports in one premium AI workspace." },
    ],
  }),
});

type Note = { id: string; title: string; content: string; created_at: string };

const MAX_CHARS = 60_000;

function Workspace() {
  const [docText, setDocText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const uidRef = useRef<string | null>(null);

  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    setNotesError(false);
    const { data: u } = await supabase.auth.getUser();
    uidRef.current = u.user?.id ?? null;
    const { data, error } = await supabase
      .from("notes")
      .select("id,title,content,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) setNotesError(true);
    else setNotes((data ?? []) as Note[]);
    setNotesLoading(false);
  }, []);

  useEffect(() => { void loadNotes(); }, [loadNotes]);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast.error("Files must be under 20MB");
    setStatus("Preparing…");
    try {
      const text = await extractFileText(file, setStatus);
      if (!text) {
        toast.error("No readable text found in that file");
        return;
      }
      setDocText(text.slice(0, MAX_CHARS));
      setFileName(file.name);
      toast.success(`Loaded ${file.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read that file");
    } finally {
      setStatus(null);
    }
  };

  const saveSelectionAsNote = async () => {
    const selected = window.getSelection()?.toString().trim();
    const content = selected || docText.trim();
    if (!content) return toast.error("Nothing to save");
    const uid = uidRef.current;
    if (!uid) return toast.error("Sign in to save notes");
    const title = (fileName ?? content.slice(0, 40)) + (selected ? " — highlight" : "");
    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: uid, title: title.slice(0, 90), content: content.slice(0, MAX_CHARS), source: fileName })
      .select("id,title,content,created_at")
      .single();
    if (error || !data) return toast.error("Couldn't save note");
    setNotes((n) => [data as Note, ...n]);
    setShowNotes(true);
    toast.success(selected ? "Highlight saved as note" : "Saved as note");
  };

  const deleteNote = async (id: string) => {
    const prev = notes;
    setNotes((n) => n.filter((x) => x.id !== id));
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) { setNotes(prev); toast.error("Couldn't delete"); }
  };

  const download = (name: string, body: string, type = "text/markdown;charset=utf-8") => {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported");
  };

  const exportDoc = () =>
    download(`${(fileName ?? "document").replace(/\.[^.]+$/, "")}.md`, `# ${fileName ?? "Document"}\n\n${docText}`);

  const exportNotes = () =>
    download(
      `jai-notes-${new Date().toISOString().slice(0, 10)}.md`,
      ["# JAI.AI Notes", "", ...notes.map((n) => `## ${n.title}\n\n${n.content}`)].join("\n\n"),
    );

  return (
    <div className="mx-auto max-w-4xl">
      {!docText && (
        <div className="mb-3">
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFile(e.dataTransfer.files[0]); }}
            className={`glass block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              dragging ? "border-primary/60 bg-primary/5" : "border-white/10 hover:border-primary/40 hover:bg-white/5"
            }`}
          >
            <input
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              className="hidden"
              disabled={!!status}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {status ? (
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-primary" />
            ) : (
              <Upload className="mx-auto mb-2 h-5 w-5 text-primary" />
            )}
            <div className="text-sm font-medium">{status ?? "Drop a PDF, image or text file"}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              PDF · PNG/JPG (OCR) · TXT · MD · CSV — up to 20MB
            </div>
          </label>
          <textarea
            value={docText}
            onChange={(e) => setDocText(e.target.value.slice(0, MAX_CHARS))}
            placeholder="…or paste any text here"
            rows={3}
            className="glass mt-2 w-full resize-none rounded-2xl bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40"
          />
        </div>
      )}

      {docText && (
        <div className="glass mb-3 rounded-2xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate font-medium">{fileName ?? "Pasted text"}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                · {docText.length.toLocaleString()} chars
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <IconBtn label="Save selection as note" onClick={saveSelectionAsNote}><Save className="h-4 w-4" /></IconBtn>
              <IconBtn label="Export document" onClick={exportDoc}><Download className="h-4 w-4" /></IconBtn>
              <IconBtn label="Remove document" onClick={() => { setDocText(""); setFileName(null); }}><X className="h-4 w-4" /></IconBtn>
            </div>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Preview extracted text — select any passage, then press save to keep it as a note
            </summary>
            <div className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-xs leading-relaxed text-muted-foreground selection:bg-primary/30 selection:text-foreground">
              {docText}
            </div>
          </details>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          onClick={() => setShowNotes((s) => !s)}
          className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors hover:bg-white/10"
        >
          <StickyNote className="h-3.5 w-3.5 text-primary" />
          Notes {notes.length > 0 && <span className="text-muted-foreground">({notes.length})</span>}
        </button>
        {showNotes && notes.length > 0 && (
          <button onClick={exportNotes} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs hover:bg-white/10">
            <Download className="h-3.5 w-3.5" /> Export notes
          </button>
        )}
      </div>

      {showNotes && (
        <div className="mb-3 space-y-2">
          {notesLoading && Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          {!notesLoading && notesError && (
            <div className="glass rounded-2xl p-4 text-center text-sm">
              <p className="text-muted-foreground">Couldn't load your notes.</p>
              <button onClick={() => void loadNotes()} className="mt-2 rounded-full bg-gradient-primary px-4 py-1.5 text-xs text-primary-foreground">
                Retry
              </button>
            </div>
          )}
          {!notesLoading && !notesError && notes.length === 0 && (
            <div className="glass rounded-2xl p-5 text-center text-sm text-muted-foreground">
              No notes yet — highlight text in a document and save it here.
            </div>
          )}
          {notes.map((n) => (
            <div key={n.id} className="glass flex items-start justify-between gap-3 rounded-2xl px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{n.title}</div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.content}</p>
              </div>
              <IconBtn label="Delete note" onClick={() => void deleteNote(n.id)}><Trash2 className="h-4 w-4" /></IconBtn>
            </div>
          ))}
        </div>
      )}

      <ToolChat key={fileName ?? "empty"} tool={TOOLS.workspace} extraContext={docText || undefined} />
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground active:scale-95"
    >
      {children}
    </button>
  );
}
