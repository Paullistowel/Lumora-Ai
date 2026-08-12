"use client";

import { useLayoutEffect, useRef } from "react";
import type { GrammarIssue } from "@/lib/grammar";
import { cn } from "../ui";

/**
 * A textarea with issue underlines drawn beneath it.
 *
 * A transparent textarea sits over a mirror div holding identically-styled
 * text plus <mark> spans. Both share the same font metrics and padding, so the
 * highlights line up exactly while the browser's native caret, selection,
 * undo history and IME all keep working — which a contenteditable would break.
 */

const UNDERLINE: Record<string, string> = {
  ERROR: "decoration-risk-critical",
  WARNING: "decoration-risk-moderate",
  SUGGESTION: "decoration-brand",
};

const SHARED =
  "w-full px-4 py-3.5 text-[15px] leading-[1.75] font-sans whitespace-pre-wrap break-words";

export function HighlightedEditor({
  value,
  onChange,
  issues,
  activeId,
  onSelectIssue,
  placeholder,
  minHeight = 380,
  readOnly,
}: {
  value: string;
  onChange: (next: string) => void;
  issues: GrammarIssue[];
  activeId?: string | null;
  onSelectIssue?: (id: string) => void;
  placeholder?: string;
  minHeight?: number;
  readOnly?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  // Keep the mirror's scroll position locked to the textarea's.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) return;
    const sync = () => {
      mirror.scrollTop = textarea.scrollTop;
      mirror.scrollLeft = textarea.scrollLeft;
    };
    textarea.addEventListener("scroll", sync);
    return () => textarea.removeEventListener("scroll", sync);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-sm)] focus-within:border-brand/50 focus-within:shadow-[var(--shadow-glow)]"
      style={{ minHeight }}
    >
      {/* Mirror: paints the underlines. */}
      <div
        ref={mirrorRef}
        aria-hidden
        className={cn(SHARED, "pointer-events-none absolute inset-0 overflow-hidden text-transparent")}
      >
        {renderSegments(value, issues, activeId)}
        {/* Trailing newline so the last line's height is preserved. */}
        {"\n"}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => {
          if (!onSelectIssue) return;
          const caret = event.currentTarget.selectionStart;
          const hit = issues.find((i) => caret >= i.start && caret <= i.end);
          if (hit) onSelectIssue(hit.id);
        }}
        placeholder={placeholder}
        spellCheck={false}
        className={cn(
          SHARED,
          "relative resize-y bg-transparent text-foreground caret-brand outline-none placeholder:text-muted",
        )}
        style={{ minHeight }}
      />
    </div>
  );
}

/** Splits the text into plain runs and highlighted runs. */
function renderSegments(
  text: string,
  issues: GrammarIssue[],
  activeId?: string | null,
) {
  if (issues.length === 0) return text;

  // Drop overlaps — the first issue at a position wins.
  const ordered = [...issues].sort((a, b) => a.start - b.start);
  const kept: GrammarIssue[] = [];
  let boundary = -1;
  for (const issue of ordered) {
    if (issue.start >= boundary && issue.end > issue.start) {
      kept.push(issue);
      boundary = issue.end;
    }
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const issue of kept) {
    if (issue.start > cursor) {
      nodes.push(<span key={`t${cursor}`}>{text.slice(cursor, issue.start)}</span>);
    }
    const isActive = issue.id === activeId;
    nodes.push(
      <mark
        key={issue.id}
        className={cn(
          "rounded-[3px] bg-transparent text-transparent underline decoration-wavy decoration-2 underline-offset-[5px] transition-colors",
          UNDERLINE[issue.severity] ?? "decoration-brand",
          isActive && "bg-brand/20",
        )}
      >
        {text.slice(issue.start, issue.end)}
      </mark>,
    );
    cursor = issue.end;
  }

  if (cursor < text.length) {
    nodes.push(<span key="tail">{text.slice(cursor)}</span>);
  }

  return nodes;
}
