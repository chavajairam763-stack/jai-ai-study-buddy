import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ToolChat } from "@/components/tool-chat";
import { TOOLS } from "@/lib/tools";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/workspace")({
  component: Workspace,
  head: () => ({ meta: [{ title: "AI Workspace — JAI.AI" }] }),
});

function Workspace() {
  const [docText, setDocText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    setLoading(true);
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        // Dynamic import — PDF.js only when needed
        const pdfjs = await import("pdfjs-dist");
        // Use CDN worker to avoid bundling
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const buf = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;
        const parts: string[] = [];
        const max = Math.min(pdf.numPages, 40);
        for (let i = 1; i <= max; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          parts.push(content.items.map((it: { str?: string }) => (typeof it.str === "string" ? it.str : "")).join(" "));
        }
        setDocText(parts.join("\n\n").slice(0, 40_000));
        setFileName(file.name);
        toast.success(`Loaded ${max} page${max === 1 ? "" : "s"} from ${file.name}`);
      } else if (file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name)) {
        const text = await file.text();
        setDocText(text.slice(0, 40_000));
        setFileName(file.name);
        toast.success(`Loaded ${file.name}`);
      } else {
        toast.error("Please upload a PDF or text file");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {!docText && (
        <div className="mb-3">
          <label className="glass block cursor-pointer rounded-2xl border-2 border-dashed border-white/10 p-6 text-center transition-colors hover:border-primary/40 hover:bg-white/5">
            <input
              type="file"
              accept=".pdf,.txt,.md,.csv,text/*,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Upload className="mx-auto mb-2 h-5 w-5 text-primary" />
            <div className="text-sm font-medium">{loading ? "Reading document…" : "Drop a PDF or paste text below"}</div>
            <div className="mt-1 text-xs text-muted-foreground">PDF · TXT · MD · CSV — up to 40k chars</div>
          </label>
          <textarea
            value={docText}
            onChange={(e) => setDocText(e.target.value.slice(0, 40_000))}
            placeholder="…or paste any text here"
            rows={3}
            className="glass mt-2 w-full resize-none rounded-2xl bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40"
          />
        </div>
      )}
      {docText && (
        <div className="glass mb-3 flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate font-medium">{fileName ?? "Pasted text"}</span>
            <span className="shrink-0 text-xs text-muted-foreground">· {docText.length.toLocaleString()} chars</span>
          </div>
          <button
            onClick={() => { setDocText(""); setFileName(null); }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10"
            aria-label="Remove document"
          ><X className="h-4 w-4" /></button>
        </div>
      )}
      <ToolChat key={fileName ?? "empty"} tool={TOOLS.workspace} extraContext={docText || undefined} />
    </div>
  );
}
