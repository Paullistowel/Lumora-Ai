"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight, Check, Copy, Gauge, Sparkles, TriangleAlert, Wand2,
} from "lucide-react";
import {
  DEFAULT_OPTIONS, detectAiStyle, humanize,
  type HumanizeOptions, type HumanizeResult,
} from "@/lib/humanize";
import {
  Alert, Badge, Button, Card, CardHeader, ScoreRing, Switch, Textarea, cn,
} from "@/components/ui";

const SAMPLE = `In today's rapidly changing world, artificial intelligence plays a crucial role in reshaping the educational landscape. It is important to note that these sophisticated systems delve into vast amounts of student data. Furthermore, they leverage cutting-edge algorithms to facilitate personalised learning experiences. Moreover, educators must navigate the complexities of implementation across diverse institutional contexts. Additionally, institutions should harness the power of predictive analytics to identify at-risk learners. Consequently, a paradigm shift is arguably generally necessary in order to unlock the potential of these tools. It is worth noting that this transformation serves as a testament to the ever-evolving nature of pedagogy.`;

const KIND_LABEL: Record<string, string> = {
  PHRASE: "Vocabulary",
  HEDGE: "Hedging",
  TRANSITION: "Connective",
  NOMINALISATION: "Buried verb",
  RHYTHM: "Rhythm",
  PUNCTUATION: "Punctuation",
};

const KIND_TONE: Record<string, "brand" | "accent" | "warning" | "success" | "neutral"> = {
  PHRASE: "brand",
  HEDGE: "warning",
  TRANSITION: "accent",
  NOMINALISATION: "success",
  RHYTHM: "neutral",
  PUNCTUATION: "neutral",
};

function scoreColour(score: number) {
  if (score >= 70) return "var(--risk-critical)";
  if (score >= 40) return "var(--risk-moderate)";
  return "var(--risk-original)";
}

function scoreLabel(score: number) {
  if (score >= 70) return "Reads as AI-generated";
  if (score >= 40) return "Some machine-like patterns";
  if (score >= 15) return "Mostly natural";
  return "Reads as human-written";
}

export function HumanizerTool() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<HumanizeOptions>(DEFAULT_OPTIONS);
  const [result, setResult] = useState<HumanizeResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Live detection while typing; rewriting only happens on demand.
  const liveReport = useMemo(() => detectAiStyle(input), [input]);
  const wordCount = (input.match(/[A-Za-z0-9'-]+/g) ?? []).length;

  function run() {
    setResult(humanize(input, options));
    setCopied(false);
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shown = result ? result.before : liveReport;

  return (
    <div className="space-y-6">
      <Alert tone="warning" title="Read this before you use it">
        This is a <strong>style</strong> tool. It removes the stock vocabulary
        and flat rhythm that make prose read as machine-written — it does not
        change who wrote the text, and it is not a way around your
        institution&apos;s rules. If your department requires you to disclose AI
        assistance, using this does not discharge that obligation. The score
        below measures <em>style</em>, not authorship: plenty of human writing
        looks uniform, and plenty of edited AI text does not.
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {/* Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Your text</h2>
              <Button
                variant="secondary"
                onClick={() => { setInput(SAMPLE); setResult(null); }}
                className="px-3 py-1.5 text-xs"
              >
                <Sparkles className="size-3.5" /> Load example
              </Button>
            </div>

            <Textarea
              value={input}
              onChange={(event) => { setInput(event.target.value); setResult(null); }}
              placeholder="Paste text that reads a little too smoothly. At least 40 words for a reliable signal."
              className="min-h-56 text-[15px] leading-relaxed"
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="gradient"
                onClick={run}
                disabled={wordCount < 40}
                className="px-5 py-2.5"
              >
                <Wand2 className="size-4" /> Humanize
              </Button>
              <span className="text-xs text-muted">
                {wordCount} words
                {wordCount < 40 ? " — need at least 40" : ""}
              </span>
            </div>
          </div>

          {/* Output */}
          <AnimatePresence>
            {result ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader
                    title="Rewritten"
                    description={`${result.changes.length} change${result.changes.length === 1 ? "" : "s"} applied`}
                    icon={<Wand2 className="size-4" />}
                    action={
                      <Button
                        variant="secondary"
                        onClick={copy}
                        className="px-3 py-1.5 text-xs"
                      >
                        {copied ? (
                          <><Check className="size-3.5 text-risk-original" /> Copied</>
                        ) : (
                          <><Copy className="size-3.5" /> Copy</>
                        )}
                      </Button>
                    }
                  />
                  <div className="rounded-xl border border-border bg-surface-muted/50 p-4 text-[15px] leading-relaxed whitespace-pre-wrap">
                    {result.text}
                  </div>

                  <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
                    <div className="text-center">
                      <p className="text-xs text-muted">Before</p>
                      <p
                        className="text-2xl font-semibold tabular-nums"
                        style={{ color: scoreColour(result.before.score) }}
                      >
                        {result.before.score}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted" />
                    <div className="text-center">
                      <p className="text-xs text-muted">After</p>
                      <p
                        className="text-2xl font-semibold tabular-nums"
                        style={{ color: scoreColour(result.after.score) }}
                      >
                        {result.after.score}
                      </p>
                    </div>
                    <p className="ml-2 text-sm text-muted">
                      AI-style score dropped by{" "}
                      <strong className="text-foreground">
                        {result.before.score - result.after.score} points
                      </strong>
                      . Read it through — automated rewriting can flatten a
                      point you meant to make.
                    </p>
                  </div>
                </Card>

                {result.changes.length > 0 ? (
                  <Card>
                    <CardHeader title="What changed" />
                    <ul className="space-y-2">
                      {result.changes.map((change, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.04, 0.5) }}
                          className="rounded-xl border border-border p-3"
                        >
                          <div className="mb-1.5 flex items-center gap-2">
                            <Badge tone={KIND_TONE[change.kind] ?? "neutral"}>
                              {KIND_LABEL[change.kind] ?? change.kind}
                            </Badge>
                          </div>
                          <p className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="rounded bg-risk-critical/10 px-1.5 py-0.5 font-mono text-xs text-risk-critical line-through">
                              {change.before}
                            </span>
                            <ArrowRight className="size-3 text-muted" />
                            <span className="rounded bg-risk-original/10 px-1.5 py-0.5 font-mono text-xs text-risk-original">
                              {change.after}
                            </span>
                          </p>
                          <p className="mt-1.5 text-xs text-muted">{change.reason}</p>
                        </motion.li>
                      ))}
                    </ul>
                  </Card>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="text-center">
            <ScoreRing
              value={wordCount >= 40 ? shown.score : 0}
              size={128}
              colour={scoreColour(shown.score)}
              caption="AI-style"
            />
            <p className="mt-2 text-sm font-semibold">
              {wordCount < 40 ? "Waiting for text" : scoreLabel(shown.score)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Stylistic signal only — never proof of how the text was produced.
            </p>
          </Card>

          {wordCount >= 40 ? (
            <Card>
              <CardHeader title="Signals detected" icon={<Gauge className="size-4" />} />
              <ul className="space-y-2.5">
                {shown.signals.map((signal, i) => (
                  <li key={i} className="border-l-2 border-border pl-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{signal.label}</p>
                      {signal.weight > 0 ? (
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
                          +{signal.weight}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{signal.detail}</p>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-xs">
                {[
                  ["Avg sentence length", `${shown.metrics.averageSentenceLength} words`],
                  ["Length variation (σ)", shown.metrics.sentenceLengthVariance],
                  ["Stock phrases", shown.metrics.tellPhraseCount],
                  ["Hedge density", `${shown.metrics.hedgeDensity}%`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-medium tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="What to rewrite" />
            <div className="space-y-3">
              <Switch
                label="Simplify vocabulary"
                description="“delve into” → “examine”"
                checked={options.simplifyVocabulary}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, simplifyVocabulary: e.target.checked }))
                }
              />
              <Switch
                label="Vary connectives"
                description="Stop every paragraph opening with “Furthermore”"
                checked={options.varyTransitions}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, varyTransitions: e.target.checked }))
                }
              />
              <Switch
                label="Activate buried verbs"
                description="“conduct an analysis of” → “analyse”"
                checked={options.activateVerbs}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, activateVerbs: e.target.checked }))
                }
              />
              <Switch
                label="Vary rhythm"
                description="Split over-long sentences at clause boundaries"
                checked={options.varyRhythm}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, varyRhythm: e.target.checked }))
                }
              />
              <Switch
                label="Trim stacked hedging"
                description="Remove the second and third hedge in a sentence"
                checked={options.trimHedging}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, trimHedging: e.target.checked }))
                }
              />
            </div>
          </Card>

          <div
            className={cn(
              "rounded-xl border border-risk-moderate/30 bg-risk-moderate/8 p-3.5",
            )}
          >
            <div className="flex gap-2.5">
              <TriangleAlert className="size-4 shrink-0 text-risk-moderate" />
              <p className="text-xs text-muted">
                Always disclose AI assistance where your institution requires
                it. Rewriting generated text does not make it your own work.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
