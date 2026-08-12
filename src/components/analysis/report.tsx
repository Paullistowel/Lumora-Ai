"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle, BookOpen, Check, FileText, Info, Layers, Quote,
  ScanSearch, Sparkles, SpellCheck, ShieldCheck,
} from "lucide-react";
import {
  Alert, Badge, Card, CardHeader, ScoreRing, Stat, cn,
} from "@/components/ui";
import { riskBand } from "@/lib/risk";
import { formatPercent } from "@/lib/format";
import type {
  AnalysisReport, MatchType, ReportParagraph,
} from "@/lib/analysis";

const MATCH_LABEL: Record<MatchType, string> = {
  VERBATIM: "Verbatim",
  NEAR_VERBATIM: "Near-verbatim",
  PARAPHRASE: "Paraphrase",
};

const MATCH_TONE: Record<MatchType, "danger" | "warning" | "accent"> = {
  VERBATIM: "danger",
  NEAR_VERBATIM: "warning",
  PARAPHRASE: "accent",
};

/** Paragraph background, graded by its strongest match. */
function heatColor(score: number) {
  if (score < 0.75) return "transparent";
  if (score < 0.85) return "color-mix(in srgb, var(--risk-moderate) 16%, transparent)";
  if (score < 0.93) return "color-mix(in srgb, var(--risk-high) 20%, transparent)";
  return "color-mix(in srgb, var(--risk-critical) 24%, transparent)";
}

function heatBar(score: number) {
  if (score < 0.75) return "var(--border)";
  if (score < 0.85) return "var(--risk-moderate)";
  if (score < 0.93) return "var(--risk-high)";
  return "var(--risk-critical)";
}

type TabKey = "OVERVIEW" | "DOCUMENT" | "WRITING" | "INTEGRITY" | "AI_STYLE";

export function AnalysisReportView({ report }: { report: AnalysisReport }) {
  const tabs = useMemo(() => {
    const list: { key: TabKey; label: string; icon: typeof Layers }[] = [
      { key: "OVERVIEW", label: "Overview", icon: Layers },
    ];
    if (report.similarity) {
      list.push({ key: "DOCUMENT", label: "Document & matches", icon: FileText });
    }
    if (report.writing) list.push({ key: "WRITING", label: "Writing", icon: SpellCheck });
    if (report.integrity) list.push({ key: "INTEGRITY", label: "Integrity", icon: ShieldCheck });
    if (report.aiStyle) list.push({ key: "AI_STYLE", label: "AI-style", icon: Sparkles });
    return list;
  }, [report]);

  const [tab, setTab] = useState<TabKey>("OVERVIEW");

  return (
    <div className="space-y-6">
      <ReportSummary report={report} />

      <div
        role="tablist"
        aria-label="Report sections"
        className="flex flex-wrap gap-1 overflow-x-auto rounded-xl border border-border bg-surface-muted p-1"
      >
        {tabs.map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            aria-selected={tab === entry.key}
            onClick={() => setTab(entry.key)}
            className={cn(
              "focus-ring relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              tab === entry.key ? "text-brand" : "text-muted hover:text-foreground",
            )}
          >
            {tab === entry.key ? (
              <motion.span
                layoutId="report-tab"
                className="absolute inset-0 -z-10 rounded-lg bg-surface shadow-[var(--shadow-sm)]"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            ) : null}
            <entry.icon className="size-4" />
            {entry.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === "OVERVIEW" ? <OverviewTab report={report} onJump={setTab} /> : null}
          {tab === "DOCUMENT" ? <DocumentTab report={report} /> : null}
          {tab === "WRITING" ? <WritingTab report={report} /> : null}
          {tab === "INTEGRITY" ? <IntegrityTab report={report} /> : null}
          {tab === "AI_STYLE" ? <AiStyleTab report={report} /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Summary ─────────────────────────────────────────────────────────────────

function ReportSummary({ report }: { report: AnalysisReport }) {
  const { similarity, writing, aiStyle, meta } = report;
  const band = similarity ? riskBand(similarity.riskLevel) : null;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        {similarity ? (
          <div className="flex items-center gap-6">
            <ScoreRing
              value={similarity.overallScore}
              size={148}
              colour={band?.color}
              label={`${similarity.overallScore}%`}
              caption="similarity"
            />
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                Risk
              </p>
              <p
                className="mt-1 text-2xl font-semibold"
                style={{ color: band?.color }}
              >
                {band?.label}
              </p>
              <p className="mt-2 max-w-[16rem] text-xs text-muted">
                {similarity.paragraphsFlagged} of {similarity.paragraphsAnalysed}{" "}
                paragraphs matched something in the corpus.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Layers className="size-6" />
            </span>
            <div>
              <p className="font-medium">Analysis complete</p>
              <p className="text-sm text-muted">
                Semantic similarity was not part of this run.
              </p>
            </div>
          </div>
        )}

        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {similarity ? (
            <>
              <Stat
                label="Paraphrased"
                value={formatPercent(similarity.breakdown.paraphrase)}
                hint="Same meaning, different words"
              />
              <Stat
                label="Verbatim"
                value={formatPercent(
                  similarity.breakdown.verbatim + similarity.breakdown.nearVerbatim,
                )}
                hint="Shared wording"
              />
              <Stat
                label="Confidence"
                value={formatPercent(similarity.confidence * 100, 0)}
                hint={
                  similarity.confidence === 0
                    ? "Empty corpus"
                    : similarity.confidence < 0.6
                      ? "Short document"
                      : "Sufficient text"
                }
              />
            </>
          ) : null}
          {writing ? (
            <Stat
              label="Writing score"
              value={`${Math.round(writing.overallScore)}`}
              hint="out of 100"
            />
          ) : null}
          {aiStyle ? (
            <Stat
              label="AI-style indicator"
              value={`${Math.round(aiStyle.score)}`}
              hint="stylistic signal, not proof"
            />
          ) : null}
          <Stat
            label="Analysed in"
            value={`${(meta.durationMs / 1000).toFixed(1)}s`}
            hint={`${meta.wordCount.toLocaleString()} words`}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-xs text-muted">
        <Badge tone={meta.backend === "transformer" ? "brand" : "warning"}>
          {meta.backend === "transformer" ? "Transformer embeddings" : "Lexical fallback"}
        </Badge>
        <span className="font-mono">{meta.model}</span>
        <span aria-hidden>·</span>
        <span>Processed locally — no external service was called.</span>
      </div>
    </Card>
  );
}

// ── Overview ────────────────────────────────────────────────────────────────

function OverviewTab({
  report,
  onJump,
}: {
  report: AnalysisReport;
  onJump: (tab: TabKey) => void;
}) {
  const { similarity } = report;

  return (
    <div className="space-y-5">
      {similarity && similarity.corpusParagraphs === 0 ? (
        <Alert tone="warning" title="Nothing to compare against">
          The comparison corpus was empty, so a 0% score here is not evidence of
          originality. Add reference sources, or compare against your Lume AI corpus.
        </Alert>
      ) : null}

      {similarity ? (
        <Card>
          <CardHeader
            title="Similarity heatmap"
            description="Every paragraph in document order. Taller, warmer bars matched more strongly."
            icon={<ScanSearch className="size-4" />}
          />
          <Heatmap paragraphs={report.paragraphs} onJump={() => onJump("DOCUMENT")} />

          <div className="mt-5 flex flex-wrap gap-4 border-t border-border pt-4 text-xs text-muted">
            {[
              { label: "No match", colour: "var(--border)" },
              { label: "Moderate", colour: "var(--risk-moderate)" },
              { label: "High", colour: "var(--risk-high)" },
              { label: "Critical", colour: "var(--risk-critical)" },
            ].map((entry) => (
              <span key={entry.label} className="inline-flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ background: entry.colour }}
                />
                {entry.label}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {similarity && similarity.sources.length > 0 ? (
        <Card>
          <CardHeader
            title="Sources matched"
            description="Where the matching passages came from."
            icon={<BookOpen className="size-4" />}
          />
          <ul className="space-y-2">
            {similarity.sources.map((source) => (
              <li
                key={source.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted/40 px-3.5 py-2.5"
              >
                <Badge tone={source.kind === "REFERENCE" ? "brand" : "accent"}>
                  {source.kind === "REFERENCE" ? "Your source" : "Platform corpus"}
                </Badge>
                <span className="min-w-0 truncate text-sm">{source.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <div className="flex gap-3">
          <Info className="size-4 shrink-0 text-brand" />
          <p className="text-sm text-muted">
            Similarity is evidence to review, not a finding of misconduct.
            Correctly quoted and cited material registers as similar by design,
            and students working from the same reading list naturally produce
            overlapping arguments. Read the matched passages before drawing any
            conclusion.
          </p>
        </div>
      </Card>
    </div>
  );
}

function Heatmap({
  paragraphs,
  onJump,
}: {
  paragraphs: ReportParagraph[];
  onJump: () => void;
}) {
  if (paragraphs.length === 0) {
    return <p className="text-sm text-muted">No paragraphs were analysed.</p>;
  }

  return (
    <div className="flex items-end gap-1 overflow-x-auto pb-1">
      {paragraphs.map((paragraph) => {
        const height = 18 + paragraph.bestScore * 62;
        return (
          <button
            key={paragraph.index}
            type="button"
            onClick={onJump}
            title={`Paragraph ${paragraph.index + 1} · ${Math.round(
              paragraph.bestScore * 100,
            )}% match${
              paragraph.matches[0] ? ` · ${paragraph.matches[0].sourceLabel}` : ""
            }`}
            aria-label={`Paragraph ${paragraph.index + 1}, ${Math.round(
              paragraph.bestScore * 100,
            )} percent match`}
            className="focus-ring group min-w-[10px] flex-1 rounded-t-sm transition-all hover:opacity-80"
            style={{
              height,
              background: heatBar(paragraph.bestScore),
              opacity: paragraph.bestScore >= 0.75 ? 1 : 0.55,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Document & matches (split screen) ───────────────────────────────────────

function DocumentTab({ report }: { report: AnalysisReport }) {
  const flaggedFirst = report.paragraphs.find((p) => p.bestScore >= 0.75);
  const [selected, setSelected] = useState<number>(
    flaggedFirst?.index ?? report.paragraphs[0]?.index ?? 0,
  );

  const paragraph = report.paragraphs.find((p) => p.index === selected);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Left — the document */}
      <Card className="lg:max-h-[42rem] lg:overflow-y-auto">
        <CardHeader
          title="Your document"
          description="Highlighted paragraphs matched the corpus. Select one to see the evidence."
          icon={<FileText className="size-4" />}
        />
        <div className="space-y-2">
          {report.paragraphs.map((entry) => {
            const flagged = entry.bestScore >= 0.75;
            return (
              <button
                key={entry.index}
                type="button"
                onClick={() => setSelected(entry.index)}
                aria-current={selected === entry.index}
                className={cn(
                  "focus-ring block w-full rounded-xl border p-3.5 text-left transition-all",
                  selected === entry.index
                    ? "border-brand ring-1 ring-brand/30"
                    : "border-border hover:border-border-strong",
                )}
                style={{ background: heatColor(entry.bestScore) }}
              >
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted">
                    Paragraph {entry.index + 1}
                  </span>
                  {flagged ? (
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{ color: heatBar(entry.bestScore) }}
                    >
                      {Math.round(entry.bestScore * 100)}% match
                    </span>
                  ) : (
                    <span className="text-xs text-muted">No match</span>
                  )}
                </div>
                <p className="line-clamp-4 text-sm leading-relaxed">{entry.text}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Right — the evidence */}
      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {!paragraph ? (
          <Card>
            <p className="text-sm text-muted">Select a paragraph to see its analysis.</p>
          </Card>
        ) : paragraph.matches.length === 0 ? (
          <Card>
            <CardHeader
              title={`Paragraph ${paragraph.index + 1}`}
              description="No passage in the corpus matched this paragraph."
              icon={<Check className="size-4" />}
            />
            <p className="rounded-xl border border-border bg-surface-muted/40 p-3.5 text-sm leading-relaxed">
              {paragraph.text}
            </p>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader
                title={`Paragraph ${paragraph.index + 1}`}
                description={`${paragraph.matches.length} matching passage${
                  paragraph.matches.length === 1 ? "" : "s"
                } found. Similarity detected — requires review.`}
                icon={<AlertTriangle className="size-4" />}
              />
              <p className="rounded-xl border border-border bg-surface-muted/40 p-3.5 text-sm leading-relaxed">
                {paragraph.text}
              </p>
            </Card>

            {paragraph.matches.map((match, index) => (
              <Card key={index}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={MATCH_TONE[match.matchType]}>
                      {MATCH_LABEL[match.matchType]}
                    </Badge>
                    <Badge tone="neutral">
                      {Math.round(match.score * 100)}% semantic
                    </Badge>
                    <Badge tone="neutral">
                      {Math.round(match.lexicalOverlap * 100)}% shared wording
                    </Badge>
                  </div>
                </div>

                <p className="mb-2 truncate text-xs font-medium text-muted">
                  Source: {match.sourceLabel}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border p-3">
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                      Your text
                    </p>
                    <p className="text-xs leading-relaxed">
                      {truncate(paragraph.text, 380)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-muted/40 p-3">
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                      Matched source
                    </p>
                    <p className="text-xs leading-relaxed text-muted">
                      {truncate(match.excerpt, 380)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 border-t border-border pt-3 text-xs text-muted">
                  {match.matchType === "PARAPHRASE"
                    ? "These passages share little vocabulary but argue the same thing — the case a word-matching checker would score near zero."
                    : match.matchType === "VERBATIM"
                      ? "Most content words are shared, so this reads as copied rather than reworded. If it is a quotation, it needs quotation marks and a citation."
                      : "Substantial shared wording alongside the shared meaning. Check whether this passage is quoted and attributed."}
                </p>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Writing ─────────────────────────────────────────────────────────────────

function WritingTab({ report }: { report: AnalysisReport }) {
  const writing = report.writing;
  if (!writing) return null;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Overall" value={Math.round(writing.overallScore)} hint="out of 100" />
        <Stat
          label="Academic tone"
          value={Math.round(writing.academicToneScore)}
          hint="out of 100"
        />
        <Stat
          label="Readability"
          value={Math.round(writing.readabilityScore)}
          hint="Flesch reading ease"
        />
        <Stat
          label="Correctness"
          value={Math.round(writing.correctnessScore)}
          hint={`${writing.grammarIssues} grammar issue${writing.grammarIssues === 1 ? "" : "s"}`}
        />
      </div>

      {writing.strengths.length > 0 ? (
        <Card>
          <CardHeader title="What is working" icon={<Check className="size-4" />} />
          <ul className="space-y-2">
            {writing.strengths.map((strength) => (
              <li key={strength} className="flex gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-risk-original" />
                {strength}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="What to improve"
          description="Ordered by how much each change would lift the piece."
          icon={<SpellCheck className="size-4" />}
        />
        {writing.issues.length === 0 ? (
          <p className="text-sm text-muted">
            No structural writing issues were detected in this draft.
          </p>
        ) : (
          <ul className="space-y-3">
            {writing.issues.map((issue, index) => (
              <li
                key={index}
                className="rounded-xl border border-border p-3.5"
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      issue.severity === "HIGH"
                        ? "danger"
                        : issue.severity === "MEDIUM"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {issue.category.replace(/_/g, " ").toLowerCase()}
                  </Badge>
                  {issue.count ? (
                    <span className="text-xs text-muted">{issue.count} occurrences</span>
                  ) : null}
                </div>
                <p className="text-sm font-medium">{issue.message}</p>
                <p className="mt-1 text-sm text-muted">{issue.suggestion}</p>
                {issue.excerpt ? (
                  <p className="mt-2 border-l-2 border-border pl-3 text-xs text-muted italic">
                    “{truncate(issue.excerpt, 180)}”
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ── Integrity ───────────────────────────────────────────────────────────────

function IntegrityTab({ report }: { report: AnalysisReport }) {
  const integrity = report.integrity;
  if (!integrity) return null;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Citations found"
          value={integrity.citationCount}
          hint="In-text references detected"
        />
        <Stat
          label="Citation density"
          value={integrity.citationsPerThousandWords}
          hint="per 1,000 words"
        />
        <Stat
          label="Quoted passages"
          value={integrity.quotedPassages}
          hint="Long quotations in the text"
        />
      </div>

      <Card>
        <CardHeader
          title="Claims worth checking"
          description="Evidence-claims with no citation nearby. These are prompts to review, not accusations."
          icon={<Quote className="size-4" />}
        />
        {integrity.unattributedClaims.length === 0 ? (
          <p className="text-sm text-muted">
            Every evidence-claim Lume AI recognised has a citation close to it.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {integrity.unattributedClaims.map((claim, index) => (
              <li
                key={index}
                className="rounded-xl border border-risk-moderate/35 bg-risk-moderate/8 p-3.5"
              >
                <p className="mb-1 text-xs font-medium text-risk-moderate">
                  “{claim.marker}” — no citation within the passage
                </p>
                <p className="text-sm leading-relaxed">{truncate(claim.excerpt, 220)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ── AI style ────────────────────────────────────────────────────────────────

function AiStyleTab({ report }: { report: AnalysisReport }) {
  const aiStyle = report.aiStyle;
  if (!aiStyle) return null;

  return (
    <div className="space-y-5">
      <Alert tone="warning" title="Read this before using the number below">
        This module measures stylistic patterns that are more common in
        generated prose. It cannot determine whether text was written by AI.
        Confident human writing can score high, and edited AI text can score
        low. Never treat this score as proof of authorship.
      </Alert>

      <Card>
        <div className="flex flex-wrap items-center gap-6">
          <ScoreRing
            value={aiStyle.score}
            size={132}
            colour={
              aiStyle.score >= 65
                ? "var(--risk-high)"
                : aiStyle.score >= 40
                  ? "var(--risk-moderate)"
                  : "var(--risk-original)"
            }
            label={`${Math.round(aiStyle.score)}`}
            caption="style signal"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold">
              {aiStyle.score >= 65
                ? "Strongly machine-like rhythm"
                : aiStyle.score >= 40
                  ? "Some machine-like patterns"
                  : "Reads as human-written prose"}
            </h3>
            <p className="mt-1.5 text-sm text-muted">
              Based on sentence-length variance, stock phrasing, hedging density
              and vocabulary range.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Signals detected" icon={<Sparkles className="size-4" />} />
        {aiStyle.signals.length === 0 ? (
          <p className="text-sm text-muted">No notable stylistic signals.</p>
        ) : (
          <ul className="space-y-2.5">
            {aiStyle.signals.map((signal, index) => (
              <li key={index} className="rounded-xl border border-border p-3.5">
                <p className="text-sm font-medium">{signal.label}</p>
                <p className="mt-1 text-sm text-muted">{signal.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Measurements" description="The raw values behind the score." />
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Average sentence length", value: aiStyle.metrics.averageSentenceLength.toFixed(1), unit: "words" },
            { label: "Sentence-length variance", value: aiStyle.metrics.sentenceLengthVariance.toFixed(1), unit: "" },
            { label: "Stock phrases", value: String(aiStyle.metrics.tellPhraseCount), unit: "" },
            { label: "Hedge density", value: aiStyle.metrics.hedgeDensity.toFixed(2), unit: "per sentence" },
            { label: "Transition density", value: aiStyle.metrics.transitionDensity.toFixed(2), unit: "per sentence" },
            { label: "Unique word ratio", value: aiStyle.metrics.uniqueWordRatio.toFixed(2), unit: "" },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-border bg-surface-muted/40 p-3"
            >
              <dt className="text-xs text-muted">{metric.label}</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {metric.value}{" "}
                {metric.unit ? (
                  <span className="text-xs font-normal text-muted">{metric.unit}</span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}

function truncate(text: string, limit: number) {
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}
