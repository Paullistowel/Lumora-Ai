"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search } from "lucide-react";
import { Card, CardHeader, cn } from "@/components/ui";

/**
 * Read-only document viewer for the review interface.
 *
 * Renders extracted text rather than embedding the original file: a reviewer
 * needs to read and refer to paragraphs, and paragraph numbering is what makes
 * "the point in paragraph 4" a usable sentence in feedback.
 */
export function DocumentViewer({
  text,
  title,
  wordCount,
}: {
  text: string;
  title: string;
  wordCount: number;
}) {
  const [query, setQuery] = useState("");
  const [scale, setScale] = useState(1);

  const paragraphs = useMemo(
    () => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
    [text],
  );

  const matches = useMemo(() => {
    if (query.trim().length < 2) return null;
    const needle = query.trim().toLowerCase();
    return new Set(
      paragraphs
        .map((paragraph, index) => (paragraph.toLowerCase().includes(needle) ? index : -1))
        .filter((index) => index >= 0),
    );
  }, [paragraphs, query]);

  return (
    <Card className="lg:sticky lg:top-24">
      <CardHeader
        title={title}
        description={`${wordCount.toLocaleString()} words · ${paragraphs.length} paragraphs`}
        action={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.85, s - 0.1))}
              aria-label="Decrease text size"
              className="focus-ring rounded-lg p-1.5 text-muted hover:bg-surface-muted"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-10 text-center text-xs tabular-nums text-muted">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(1.4, s + 0.1))}
              aria-label="Increase text size"
              className="focus-ring rounded-lg p-1.5 text-muted hover:bg-surface-muted"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        }
      />

      <label className="relative mb-4 block">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find in document…"
          aria-label="Find in document"
          className="focus-ring w-full rounded-xl border border-border bg-surface py-2.5 pr-3.5 pl-9 text-sm"
        />
      </label>

      {matches ? (
        <p className="mb-3 text-xs text-muted">
          {matches.size} paragraph{matches.size === 1 ? "" : "s"} match “{query.trim()}”
        </p>
      ) : null}

      <div
        className="max-h-[34rem] space-y-4 overflow-y-auto pr-1"
        style={{ fontSize: `${scale}rem` }}
      >
        {paragraphs.map((paragraph, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-3 rounded-lg px-2 py-1 transition-colors",
              matches?.has(index) && "bg-brand-soft",
            )}
          >
            <span
              className="mt-1 shrink-0 font-mono text-[0.7em] text-muted select-none"
              aria-hidden
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="leading-relaxed">{paragraph}</p>
          </div>
        ))}

        {paragraphs.length === 0 ? (
          <p className="text-sm text-muted">
            No readable text could be extracted from this document.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
