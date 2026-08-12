"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  BookOpen, Check, Eraser, FileDown, Sparkles, Wand2, X, Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  applyAll, applyOne, CATEGORY_LABEL, checkGrammar,
  type GrammarCategory, type GrammarIssue,
} from "@/lib/grammar";
import { HighlightedEditor } from "@/components/tools/highlighted-editor";
import { Badge, Button, Card, ScoreRing, cn } from "@/components/ui";

const SAMPLE = `The research show that thier is a clear affect on student outcomes in higher education. i beleive this is definately an area that deserves more attention then it currently recieves.

However the data was collected by the research team over a very long period of time and it's own limitations are seperate from the analysis presented here, which is why in order to properly understand the results we must first consider the methodology that was used by the researchers who conducted the original study that we are discussing in this particular section of the paper.

Its important to note that alot of students recieve detailed feedback ,but they don't act on it. This is a huge problem and basically means that the whole process is kind of pointless.`;

const CATEGORY_TONE: Record<GrammarCategory, "danger" | "warning" | "brand" | "accent" | "neutral"> = {
  SPELLING: "danger",
  GRAMMAR: "danger",
  CONFUSED_WORDS: "danger",
  PUNCTUATION: "warning",
  CLARITY: "brand",
  STYLE: "accent",
  FORMALITY: "accent",
};

const SEVERITY_DOT: Record<string, string> = {
  ERROR: "bg-risk-critical",
  WARNING: "bg-risk-moderate",
  SUGGESTION: "bg-brand",
};

type Filter = "ALL" | GrammarCategory;

export function GrammarTool() {
  const [text, setText] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Defer analysis so typing never blocks on a full re-scan of a long essay.
  const deferred = useDeferredValue(text);
  const report = useMemo(() => checkGrammar(deferred), [deferred]);

  // Offsets are recomputed on every keystroke, so dismissals are keyed by the
  // issue's content rather than its generated id.
  const dismissKey = (issue: GrammarIssue) =>
    `${issue.category}:${issue.start}:${issue.match}`;

  const live = report.issues.filter((issue) => !dismissed.has(dismissKey(issue)));
  const visible = filter === "ALL" ? live : live.filter((i) => i.category === filter);

  const score = report.stats.correctnessScore;
  const scoreColour =
    score >= 85 ? "var(--risk-original)" : score >= 60 ? "var(--risk-moderate)" : "var(--risk-critical)";

  function accept(issue: GrammarIssue, replacement: string) {
    setText((current) => applyOne(current, issue, replacement));
    setActiveId(null);
  }

  function fixAll() {
    setText((current) => applyAll(current, live));
    setActiveId(null);
  }

  function download() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "corrected.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  const fixableCount = live.filter((i) => i.replacements.length > 0).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
      {/* ── Editor ─────────────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => { setText(SAMPLE); setDismissed(new Set()); }}
            className="px-3 py-2 text-xs"
          >
            <Sparkles className="size-3.5" /> Load sample
          </Button>
          <Button
            variant="secondary"
            onClick={() => { setText(""); setDismissed(new Set()); setActiveId(null); }}
            disabled={!text}
            className="px-3 py-2 text-xs"
          >
            <Eraser className="size-3.5" /> Clear
          </Button>
          <Button
            variant="secondary"
            onClick={download}
            disabled={!text}
            className="px-3 py-2 text-xs"
          >
            <FileDown className="size-3.5" /> Download
          </Button>
          <div className="ml-auto">
            <Button
              variant="gradient"
              onClick={fixAll}
              disabled={fixableCount === 0}
              className="px-3.5 py-2 text-xs"
            >
              <Zap className="size-3.5" />
              Fix all {fixableCount > 0 ? `(${fixableCount})` : ""}
            </Button>
          </div>
        </div>

        <HighlightedEditor
          value={text}
          onChange={setText}
          issues={live}
          activeId={activeId}
          onSelectIssue={setActiveId}
          placeholder="Paste or type your essay here. Issues are underlined as you write — nothing is uploaded, all analysis runs in your browser."
        />

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-xs text-muted">
          <span>{report.stats.words} words</span>
          <span>{report.stats.sentences} sentences</span>
          <span>{report.stats.characters} characters</span>
          <span>{report.stats.readingTimeMinutes} min read</span>
          <span>Grade level {report.stats.gradeLevel}</span>
          <span>Reading ease {report.stats.readabilityScore}</span>
        </div>
      </div>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="flex items-center gap-4">
          <ScoreRing
            value={text.length > 0 ? score : 0}
            size={104}
            colour={scoreColour}
            caption="correctness"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {text.length === 0
                ? "Waiting for text"
                : live.length === 0
                  ? "No issues found"
                  : `${live.length} issue${live.length === 1 ? "" : "s"}`}
            </p>
            <p className="mt-1 text-xs text-muted">
              {text.length === 0
                ? "Start typing to see live suggestions."
                : live.length === 0
                  ? "This reads cleanly."
                  : "Click any card to jump to it."}
            </p>
          </div>
        </Card>

        {live.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            <FilterChip label="All" count={live.length} active={filter === "ALL"} onClick={() => setFilter("ALL")} />
            {(Object.keys(CATEGORY_LABEL) as GrammarCategory[])
              .filter((c) => live.some((i) => i.category === c))
              .map((category) => (
                <FilterChip
                  key={category}
                  label={CATEGORY_LABEL[category]}
                  count={live.filter((i) => i.category === category).length}
                  active={filter === category}
                  onClick={() => setFilter(category)}
                />
              ))}
          </div>
        ) : null}

        <div className="space-y-2.5">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((issue) => (
              <motion.div
                key={`${issue.category}-${issue.start}-${issue.match}`}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  type="button"
                  onMouseEnter={() => setActiveId(issue.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onFocus={() => setActiveId(issue.id)}
                  onBlur={() => setActiveId(null)}
                  className={cn(
                    "focus-ring w-full rounded-xl border bg-surface p-3.5 text-left transition-all",
                    activeId === issue.id
                      ? "border-brand/50 shadow-[var(--shadow-md)]"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", SEVERITY_DOT[issue.severity])} />
                    <span className="text-xs font-semibold">{issue.title}</span>
                    <Badge tone={CATEGORY_TONE[issue.category]} className="ml-auto">
                      {CATEGORY_LABEL[issue.category]}
                    </Badge>
                  </div>

                  <p className="mb-2 font-mono text-xs break-words text-muted">
                    “{issue.match.length > 60 ? `${issue.match.slice(0, 60)}…` : issue.match}”
                  </p>
                  <p className="text-xs leading-relaxed text-muted">{issue.message}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {issue.replacements.map((replacement) => (
                      <span
                        key={replacement}
                        role="button"
                        tabIndex={0}
                        onClick={(event) => { event.stopPropagation(); accept(issue, replacement); }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            accept(issue, replacement);
                          }
                        }}
                        className="focus-ring inline-flex cursor-pointer items-center gap-1 rounded-lg bg-brand px-2.5 py-1 text-xs font-medium text-brand-fg transition-transform hover:scale-105"
                      >
                        <Check className="size-3" />
                        {replacement === "(delete)" ? "Remove" : replacement}
                      </span>
                    ))}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDismissed((current) => new Set(current).add(dismissKey(issue)));
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setDismissed((current) => new Set(current).add(dismissKey(issue)));
                        }
                      }}
                      className="focus-ring inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:bg-surface-muted"
                    >
                      <X className="size-3" /> Dismiss
                    </span>
                  </div>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {text.length > 0 && live.length === 0 ? (
            <Card className="text-center">
              <Check className="mx-auto mb-2 size-8 text-risk-original" />
              <p className="text-sm font-medium">Nothing to flag</p>
              <p className="mt-1 text-xs text-muted">
                Grammar, spelling and academic style all check out.
              </p>
            </Card>
          ) : null}

          {text.length === 0 ? (
            <Card>
              <div className="flex gap-3">
                <BookOpen className="size-4 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-medium">What gets checked</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    <li>Spelling and commonly confused words</li>
                    <li>Subject–verb agreement and articles</li>
                    <li>Punctuation, spacing and capitalisation</li>
                    <li>Wordiness, passive voice and long sentences</li>
                    <li>Contractions and informal vocabulary</li>
                  </ul>
                  <p className="mt-3 text-xs text-muted">
                    Quotations and citations are skipped, so quoted material is
                    never “corrected”.
                  </p>
                </div>
              </div>
            </Card>
          ) : null}
        </div>

        {dismissed.size > 0 ? (
          <button
            type="button"
            onClick={() => setDismissed(new Set())}
            className="focus-ring w-full rounded-lg py-2 text-xs text-muted hover:text-brand"
          >
            <Wand2 className="mr-1 inline size-3" />
            Restore {dismissed.size} dismissed
          </button>
        ) : null}
      </aside>
    </div>
  );
}

function FilterChip({
  label, count, active, onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-brand bg-brand text-brand-fg"
          : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
      )}
    >
      {label} <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );
}
