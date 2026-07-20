import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, FileText, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pdf")({ component: PDFPage });

function PDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">PDF Analysis</h1>
        <p className="mt-1 text-muted-foreground">Upload a PDF, get summaries, notes, and instant Q&A.</p>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
        className={`glass rounded-3xl border-2 border-dashed p-16 text-center transition-all ${dragging ? "border-primary glow-sm" : "border-white/10"}`}
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary glow-sm"><Upload className="h-6 w-6 text-primary-foreground" /></div>
        <p className="font-semibold">Drop your PDF here</p>
        <p className="mt-1 text-sm text-muted-foreground">or click to browse — up to 20MB</p>
        <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground glow-sm">
          <Upload className="h-4 w-4" /> Choose PDF
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        </label>
        {file && <p className="mt-4 text-sm text-primary">{file.name}</p>}
      </div>

      {file && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Summarize", icon: Sparkles },
            { title: "Generate Notes", icon: FileText },
            { title: "Create Quiz", icon: Sparkles },
            { title: "Important Q's", icon: Sparkles },
          ].map((a) => (
            <button key={a.title} onClick={() => toast.info(`${a.title} — coming soon`)} className="glass rounded-2xl p-5 text-left hover:glow-sm">
              <a.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-semibold">{a.title}</div>
              <div className="text-xs text-muted-foreground">Powered by JAI</div>
            </button>
          ))}
          <button onClick={() => toast.info("Export PDF — coming soon")} className="glass-strong col-span-full flex items-center justify-center gap-2 rounded-2xl p-4 text-sm font-semibold">
            <Download className="h-4 w-4" /> Export notes as PDF
          </button>
        </div>
      )}
    </div>
  );
}
