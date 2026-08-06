/** Client-side text extraction for chat attachments (PDF + plain text). */
export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    const buf = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((it) => ("str" in it ? (it as { str: string }).str : ""))
          .join(" "),
      );
    }
    return pages.join("\n\n").trim();
  }
  // txt, md, csv, json, code files
  return (await file.text()).trim();
}

export const ACCEPTED_FILE_TYPES =
  ".pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.py,.java,.c,.cpp,.html,.css";
