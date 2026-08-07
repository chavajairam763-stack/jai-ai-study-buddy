/** Client-side text extraction for chat attachments (PDF, images via OCR, plain text). */

const IMAGE_RE = /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i;

export function isImageFile(file: File) {
  return file.type.startsWith("image/") || IMAGE_RE.test(file.name);
}

/** Lazy-loaded OCR — tesseract.js is heavy, so it only ships when actually used. */
export async function ocrImage(
  file: File | Blob,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.(Math.round(m.progress * 100));
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return (data.text ?? "").trim();
  } finally {
    await worker.terminate();
  }
}

export async function extractPdfText(
  file: File,
  opts: { maxPages?: number; onProgress?: (page: number, total: number) => void } = {},
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const buf = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const total = Math.min(pdf.numPages, opts.maxPages ?? 60);
  const pages: string[] = [];
  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((it) => ("str" in it ? (it as { str: string }).str : ""))
        .join(" "),
    );
    opts.onProgress?.(i, total);
  }
  return pages.join("\n\n").trim();
}

export async function extractFileText(
  file: File,
  onStatus?: (status: string) => void,
): Promise<string> {
  if (isImageFile(file)) {
    onStatus?.("Running OCR…");
    return ocrImage(file, (p) => onStatus?.(`Running OCR… ${p}%`));
  }
  if (file.name.toLowerCase().endsWith(".pdf")) {
    onStatus?.("Reading PDF…");
    return extractPdfText(file, {
      onProgress: (p, t) => onStatus?.(`Reading PDF… page ${p}/${t}`),
    });
  }
  // txt, md, csv, json, code files
  return (await file.text()).trim();
}

export const ACCEPTED_FILE_TYPES =
  ".pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.py,.java,.c,.cpp,.html,.css,.png,.jpg,.jpeg,.webp";
