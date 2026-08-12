/**
 * Module 4 — Document Processing Engine.
 * Extract → clean → paragraph-detect → sentence-tokenize.
 */

export type SupportedType = "pdf" | "docx" | "doc" | "txt" | "md";

export const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt", ".md"] as const;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

/** Human-readable list for upload hints, e.g. "PDF, DOCX, DOC, TXT or MD". */
export const ACCEPTED_LABEL = "PDF, DOCX, DOC, TXT or MD";

export function detectType(fileName: string): SupportedType | null {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "pdf";
    case ".docx":
      return "docx";
    case ".doc":
      return "doc";
    case ".txt":
      return "txt";
    case ".md":
      return "md";
    default:
      return null;
  }
}

export async function extractText(
  buffer: Buffer,
  type: SupportedType,
): Promise<string> {
  switch (type) {
    case "pdf": {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const { text } = await parser.getText();
        return text;
      } finally {
        await parser.destroy();
      }
    }
    case "docx": {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    }
    case "doc": {
      // Legacy binary .doc is a different container from .docx. mammoth reads
      // the OOXML form only, so a genuine Word 97–2003 file lands in the catch
      // and gets an instruction the user can act on rather than a parser error.
      try {
        const mammoth = await import("mammoth");
        const { value } = await mammoth.extractRawText({ buffer });
        if (value.trim().length > 0) return value;
      } catch {
        // fall through to the guidance below
      }
      throw new Error(
        "This looks like a legacy Word 97–2003 file. Open it in Word or Google Docs and save it as .docx or .pdf, then upload again.",
      );
    }
    case "md":
      return stripMarkdown(buffer.toString("utf8"));
    case "txt":
      return buffer.toString("utf8");
  }
}

function stripMarkdown(input: string) {
  return input
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → label
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/^\s*[-*+]\s+/gm, "") // bullets
    .replace(/(\*\*|__|\*|_)/g, ""); // emphasis
}

/**
 * Normalises whitespace and the punctuation PDF extractors mangle, while
 * preserving blank lines so paragraph boundaries survive.
 */
export function cleanText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/-\n(?=[a-z])/g, "") // de-hyphenate words split across lines
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type Paragraph = { index: number; text: string; charStart: number; charEnd: number };

/**
 * Splits on blank lines. PDFs often lack them, so a single-block document is
 * re-split on sentence groups to keep chunks comparable in size.
 */
export function detectParagraphs(text: string, minChars = 120): Paragraph[] {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.replace(/\n/g, " ").trim())
    .filter(Boolean);

  const source = blocks.length > 1 ? blocks : regroupSentences(text, 4);

  const paragraphs: Paragraph[] = [];
  let cursor = 0;

  for (const block of source) {
    const charStart = text.indexOf(block.slice(0, 40), cursor);
    const start = charStart >= 0 ? charStart : cursor;
    // Very short blocks are headings or stray lines — merge them forward so we
    // never embed a two-word "chunk".
    if (block.length < minChars && paragraphs.length > 0) {
      const previous = paragraphs[paragraphs.length - 1];
      previous.text = `${previous.text} ${block}`.trim();
      previous.charEnd = start + block.length;
      continue;
    }
    paragraphs.push({
      index: paragraphs.length,
      text: block,
      charStart: start,
      charEnd: start + block.length,
    });
    cursor = start + block.length;
  }

  return paragraphs.filter((p) => p.text.length >= 40);
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])["')\]]?\s+(?=[A-Z0-9"'(\[])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function regroupSentences(text: string, perGroup: number): string[] {
  const sentences = splitSentences(text.replace(/\n/g, " "));
  const groups: string[] = [];
  for (let i = 0; i < sentences.length; i += perGroup) {
    groups.push(sentences.slice(i, i + perGroup).join(" "));
  }
  return groups;
}

export function countWords(text: string): number {
  const matches = text.match(/[A-Za-z0-9'-]+/g);
  return matches ? matches.length : 0;
}
