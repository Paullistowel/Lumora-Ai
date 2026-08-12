"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle, FileText, Info, Plus, ScanSearch, Sparkles, Trash2,
} from "lucide-react";
import { Alert, Badge, Button, Card, CardHeader, ScoreRing, Textarea, cn } from "@/components/ui";
import { riskBand, riskLevelFor } from "@/lib/risk";

/**
 * Browser-side plagiarism check.
 *
 * The full platform compares against every submission in a cohort using
 * transformer embeddings on the server. This public tool has no corpus and no
 * server round-trip, so it compares the draft against sources the user supplies
 * using a local lexical similarity measure. The page says so plainly rather
 * than implying it is the same engine.
 */

const SAMPLE_DRAFT = `Artificial intelligence has transformed the way higher education institutions handle academic honesty. Conventional plagiarism tools depend on matching strings of text, which catches directly copied sections but misses cases where a learner expresses an identical concept using alternative phrasing.

Meaning-based detection closes this gap. By transforming every paragraph into a numerical representation that captures sense instead of wording, the software identifies when two passages with different vocabulary convey the same claim.

Nevertheless, a high semantic score does not establish wrongdoing. Learners drawing on an identical set of readings will inevitably generate similar reasoning, and properly attributed quotations appear similar as a matter of course.`;

const SAMPLE_SOURCE = `Machine learning has reshaped how universities approach academic integrity. Traditional plagiarism detection relies on string matching, which identifies copied passages but fails when a student rewrites the same idea in different words.

Semantic detection addresses this gap. By converting each paragraph into a dense vector that encodes meaning rather than surface form, the system can recognise that two differently worded passages express the same argument.

However, semantic similarity is not proof of misconduct. Students working from the same reading list will naturally produce overlapping arguments, and correctly quoted material registers as similar by design.`;

type Source = { id: string; label: string; text: string };

type ParagraphResult = {
  index: number;
  text: string;
  score: number;
  sourceLabel: string | null;
  sourceExcerpt: string | null;
  sharedTerms: string[];
};

const STOP = new Set([
  "a","an","and","are","as","at","be","been","but","by","for","from","has","have",
  "he","in","is","it","its","of","on","or","that","the","this","to","was","were",
  "will","with","which","their","they","them","these","those","there","not","can",
  "when","where","what","how","than","then","also","into","such","some","more",
  "most","other","over","only","them","would","could","should","may","might",
]);

function tokenise(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter(
    (word) => word.length > 2 && !STOP.has(word),
  );
}

/** Bag-of-words cosine over unigrams and bigrams, sub-linearly weighted. */
function vectorise(text: string): Map<string, number> {
  const tokens = tokenise(text);
  const counts = new Map<string, number>();
  const bump = (term: string, weight: number) =>
    counts.set(term, (counts.get(term) ?? 0) + weight);

  for (let i = 0; i < tokens.length; i++) {
    bump(tokens[i], 1);
    if (i + 1 < tokens.length) bump(`${tokens[i]}~${tokens[i + 1]}`, 1.6);
  }
  for (const [term, count] of counts) counts.set(term, 1 + Math.log(count));

  let norm = 0;
  for (const value of counts.values()) norm += value * value;
  norm = Math.sqrt(norm) || 1;
  for (const [term, value] of counts) counts.set(term, value / norm);
  return counts;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  // Iterate the smaller map — the vectors are sparse.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, value] of small) {
    const other = large.get(term);
    if (other) dot += value * other;
  }
  return dot;
}

function paragraphsOf(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 60);
}

export function PlagiarismTool() {
  const [draft, setDraft] = useState("");
  const [sources, setSources] = useState<Source[]>([
    { id: "s1", label: "Source 1", text: "" },
  ]);
  const [checked, setChecked] = useState(false);

  const result = useMemo(() => {
    if (!checked) return null;

    const paragraphs = paragraphsOf(draft);
    const corpus = sources
      .filter((source) => source.text.trim().length > 60)
      .flatMap((source) =>
        paragraphsOf(source.text).map((text) => ({
          label: source.label,
          text,
          vector: vectorise(text),
        })),
      );

    if (paragraphs.length === 0 || corpus.length === 0) {
      return { paragraphs: [] as ParagraphResult[], overall: 0, corpusSize: corpus.length };
    }

    const results: ParagraphResult[] = paragraphs.map((text, index) => {
      const vector = vectorise(text);
      let best = { score: 0, label: null as string | null, excerpt: null as string | null };

      for (const candidate of corpus) {
        const score = cosine(vector, candidate.vector);
        if (score > best.score) {
          best = { score, label: candidate.label, excerpt: candidate.text };
        }
      }

      const draftTerms = new Set(tokenise(text));
      const sharedTerms = best.excerpt
        ? [...new Set(tokenise(best.excerpt))].filter((t) => draftTerms.has(t)).slice(0, 8)
        : [];

      return {
        index,
        text,
        score: best.score,
        sourceLabel: best.score >= 0.3 ? best.label : null,
        sourceExcerpt: best.score >= 0.3 ? best.excerpt : null,
        sharedTerms,
      };
    });

    // Length-weighted, matching the server engine's roll-up.
    const totalWeight = results.reduce((sum, r) => sum + r.text.length, 0);
    const matched = results.reduce(
      (sum, r) => sum + (r.score >= 0.3 ? r.score * r.text.length : 0),
      0,
    );
    const overall = totalWeight > 0 ? (matched / totalWeight) * 100 : 0;

    return { paragraphs: results, overall: Math.round(overall * 10) / 10, corpusSize: corpus.length };
  }, [checked, draft, sources]);

  const band = result ? riskBand(riskLevelFor(result.overall)) : null;

  function addSource() {
    setSources((current) => [
      ...current,
      { id: `s${Date.now()}`, label: `Source ${current.length + 1}`, text: "" },
    ]);
  }

  function loadSample() {
    setDraft(SAMPLE_DRAFT);
    setSources([{ id: "s1", label: "Course reading", text: SAMPLE_SOURCE }]);
    setChecked(false);
  }

  const canCheck =
    draft.trim().length > 120 && sources.some((s) => s.text.trim().length > 60);

  return (
    <div className="space-y-6">
      <Alert tone="info" title="How this differs from the full platform">
        This browser tool compares your draft against sources you paste in,
        using word-overlap similarity. The full AI-AIMS engine compares meaning
        with transformer embeddings across an entire cohort&apos;s submissions —
        which is what catches a paraphrase that shares no wording.{" "}
        <span className="font-medium">Nothing you paste here is uploaded.</span>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="size-4 text-brand" /> Your draft
            </h2>
            <Button variant="secondary" onClick={loadSample} className="px-3 py-1.5 text-xs">
              <Sparkles className="size-3.5" /> Load example
            </Button>
          </div>
          <Textarea
            value={draft}
            onChange={(event) => { setDraft(event.target.value); setChecked(false); }}
            placeholder="Paste the text you want to check. Separate paragraphs with a blank line."
            className="min-h-72 leading-relaxed"
          />
          <p className="text-xs text-muted">
            {tokenise(draft).length} content words · {paragraphsOf(draft).length} paragraphs
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ScanSearch className="size-4 text-accent" /> Compare against
            </h2>
            <Button variant="secondary" onClick={addSource} className="px-3 py-1.5 text-xs">
              <Plus className="size-3.5" /> Add source
            </Button>
          </div>

          <div className="space-y-3">
            {sources.map((source, i) => (
              <div key={source.id} className="rounded-2xl border border-border bg-surface p-3">
                <div className="mb-2 flex items-center gap-2">
                  <input
                    value={source.label}
                    onChange={(event) =>
                      setSources((current) =>
                        current.map((s) =>
                          s.id === source.id ? { ...s, label: event.target.value } : s,
                        ),
                      )
                    }
                    className="focus-ring min-w-0 flex-1 rounded-lg bg-transparent px-1 py-0.5 text-sm font-medium"
                    aria-label={`Label for source ${i + 1}`}
                  />
                  {sources.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSources((current) => current.filter((s) => s.id !== source.id))
                      }
                      aria-label={`Remove ${source.label}`}
                      className="focus-ring rounded-lg p-1.5 text-muted hover:text-risk-critical"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <Textarea
                  value={source.text}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSources((current) =>
                      current.map((s) => (s.id === source.id ? { ...s, text: value } : s)),
                    );
                    setChecked(false);
                  }}
                  placeholder="Paste a reading, a classmate's shared draft, or your own earlier essay."
                  className="min-h-32 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="gradient"
          onClick={() => setChecked(true)}
          disabled={!canCheck}
          className="px-6 py-3"
        >
          <ScanSearch className="size-4" /> Check for overlap
        </Button>
        {!canCheck ? (
          <p className="text-xs text-muted">
            Add at least a paragraph of draft and one source to run a check.
          </p>
        ) : null}
      </div>

      <AnimatePresence>
        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {result.paragraphs.length === 0 ? (
              <Alert tone="warning">
                Not enough text to compare. Paragraphs need to be at least a
                couple of sentences long.
              </Alert>
            ) : (
              <>
                <Card>
                  <div className="flex flex-wrap items-center gap-6">
                    <ScoreRing
                      value={result.overall}
                      size={128}
                      colour={band?.color}
                      label={`${result.overall}%`}
                      caption="overlap"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{band?.label}</h3>
                        <Badge tone={band?.tone ?? "neutral"}>
                          {result.paragraphs.filter((p) => p.score >= 0.3).length} of{" "}
                          {result.paragraphs.length} paragraphs flagged
                        </Badge>
                      </div>
                      <p className="text-sm text-muted">
                        Compared against {result.corpusSize} source paragraph
                        {result.corpusSize === 1 ? "" : "s"}. A high score is not
                        an accusation — correctly quoted and cited material
                        registers as similar by design.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardHeader
                    title="Paragraph breakdown"
                    description="Highlighted paragraphs overlap substantially with a source you provided."
                    icon={<AlertTriangle className="size-4" />}
                  />
                  <div className="space-y-2.5">
                    {result.paragraphs.map((paragraph) => {
                      const flagged = paragraph.score >= 0.3;
                      const strong = paragraph.score >= 0.55;
                      return (
                        <motion.div
                          key={paragraph.index}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: paragraph.index * 0.05 }}
                          className={cn(
                            "rounded-xl border p-3.5",
                            strong
                              ? "border-risk-critical/40 bg-risk-critical/8"
                              : flagged
                                ? "border-risk-moderate/40 bg-risk-moderate/8"
                                : "border-border",
                          )}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-muted">
                              Paragraph {paragraph.index + 1}
                            </span>
                            <span
                              className="text-xs font-semibold tabular-nums"
                              style={{
                                color: flagged
                                  ? strong
                                    ? "var(--risk-critical)"
                                    : "var(--risk-moderate)"
                                  : "var(--muted)",
                              }}
                            >
                              {Math.round(paragraph.score * 100)}% overlap
                            </span>
                          </div>

                          <p className="text-sm leading-relaxed">
                            {paragraph.text.length > 300
                              ? `${paragraph.text.slice(0, 300)}…`
                              : paragraph.text}
                          </p>

                          {flagged && paragraph.sourceExcerpt ? (
                            <div className="mt-3 border-t border-border/60 pt-3">
                              <p className="mb-1.5 text-xs font-medium text-muted">
                                Closest match in {paragraph.sourceLabel}
                              </p>
                              <p className="border-l-2 border-border pl-3 text-xs leading-relaxed text-muted">
                                {paragraph.sourceExcerpt.slice(0, 220)}…
                              </p>
                              {paragraph.sharedTerms.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {paragraph.sharedTerms.map((term) => (
                                    <span
                                      key={term}
                                      className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-muted"
                                    >
                                      {term}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>

                <Card>
                  <div className="flex gap-3">
                    <Info className="size-4 shrink-0 text-brand" />
                    <p className="text-sm text-muted">
                      Overlap with a source you are citing is expected. What
                      matters is whether the borrowed material is quoted,
                      attributed and doing work in your argument. If a flagged
                      paragraph has no citation, add one before you submit.
                    </p>
                  </div>
                </Card>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
