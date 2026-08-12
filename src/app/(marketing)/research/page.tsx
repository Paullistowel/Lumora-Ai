import {
  AlertTriangle, Database, FlaskConical, Gauge, Layers, MapPin, Target,
  TelescopeIcon,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { MaturityBadge, type MaturityKey } from "@/components/brand";
import {
  EvaluationPending, ModelComparison, ModelDetail,
} from "@/components/research/evaluation";
import { Badge, Card, CardHeader, PageHeader, SectionHeading, Table, Td, Th } from "@/components/ui";
import {
  FUTURE_WORK, GHANA_CONTEXT, LIMITATIONS, OBJECTIVES, RESEARCH_GAP,
  RESEARCH_PROBLEM, RESEARCH_TARGETS, getBenchmarkResults, getUsabilityStudy,
  getWritingStudy,
} from "@/lib/research";

export const metadata = {
  title: "Research & evaluation",
  description:
    "The research problem, objectives, model benchmark and evaluation status for Lume AI — a research prototype from Group 4, KNUST, 2026.",
};

export default async function ResearchPage() {
  const [benchmark, usability, writing] = await Promise.all([
    getBenchmarkResults(),
    getUsabilityStudy(),
    getWritingStudy(),
  ]);

  const measuredModels = benchmark?.models.filter((m) => m.status === "measured") ?? [];

  // Target ↔ measurement, resolved only from files that actually exist.
  const targetRows = RESEARCH_TARGETS.map((target) => {
    let measured: string | null = null;

    if (target.source === "benchmark" && measuredModels.length > 0) {
      const best = measuredModels.reduce((a, b) =>
        a.status === "measured" && b.status === "measured" && b.metrics.f1 > a.metrics.f1
          ? b
          : a,
      );
      if (best.status === "measured") {
        measured =
          target.id === "T1"
            ? `${(best.metrics.precision * 100).toFixed(1)}% (${best.label})`
            : `${(best.latency.meanMsPerPair / 1000).toFixed(2)}s per pair (${best.label})`;
      }
    }
    if (target.source === "sus" && usability) {
      measured = `${usability.meanScore.toFixed(1)} (n=${usability.participants})`;
    }
    if (target.source === "writing" && writing) {
      measured = `${writing.meanImprovementPercent.toFixed(1)}% (n=${writing.participants})`;
    }

    return { ...target, measured };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Reveal>
        <PageHeader
          eyebrow="Research prototype · Group 4 · KNUST · 2026"
          title="Research & evaluation"
          description="What Lume AI set out to answer, what has been built, and — separately and honestly — what has actually been measured."
        />
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="mb-10 border-brand/25 bg-brand-soft">
          <div className="flex gap-3">
            <AlertTriangle className="size-4 shrink-0 text-brand" />
            <p className="text-sm">
              <span className="font-semibold">No figure on this page is estimated.</span>{" "}
              Every metric is read from evaluation files produced by the benchmark
              harness in this repository. Where a study has not been run, the page
              says <em>evaluation pending</em> rather than showing a placeholder
              number.
            </p>
          </div>
        </Card>
      </Reveal>

      {/* ── Problem & gap ────────────────────────────────────────────────── */}
      <section className="mb-16 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <CardHeader title="The research problem" icon={<Target className="size-4" />} />
            <h3 className="text-lg font-semibold">{RESEARCH_PROBLEM.title}</h3>
            <p className="mt-2 text-sm text-muted">{RESEARCH_PROBLEM.body}</p>
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="h-full">
            <CardHeader title="The research gap" icon={<TelescopeIcon className="size-4" />} />
            <h3 className="text-lg font-semibold">{RESEARCH_GAP.title}</h3>
            <p className="mt-2 text-sm text-muted">{RESEARCH_GAP.body}</p>
          </Card>
        </Reveal>
      </section>

      {/* ── Objectives ───────────────────────────────────────────────────── */}
      <section className="mb-16">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow="Objectives"
            title="What the project set out to do"
            description="Each objective carries its real status. Implemented means working software; pending means the research has not been carried out yet."
          />
        </Reveal>

        <Stagger className="mt-8 grid gap-4 md:grid-cols-2">
          {OBJECTIVES.map((objective) => (
            <StaggerItem key={objective.id}>
              <Card className="h-full">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-muted">{objective.id}</span>
                  <MaturityBadge status={objective.status as MaturityKey} />
                </div>
                <h3 className="font-semibold">{objective.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{objective.detail}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Targets vs measured ──────────────────────────────────────────── */}
      <section className="mb-16">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow="Targets"
            title="Research targets, and where each one stands"
            description="The target column states what the proposal aims for. The result column is empty until a measurement exists."
          />
        </Reveal>

        <div className="mt-8">
          <Table>
            <thead>
              <tr>
                <Th>Metric</Th>
                <Th>Target</Th>
                <Th>Current result</Th>
                <Th>Measured by</Th>
              </tr>
            </thead>
            <tbody>
              {targetRows.map((row) => (
                <tr key={row.id}>
                  <Td className="font-medium">{row.metric}</Td>
                  <Td className="tabular-nums">{row.target}</Td>
                  <Td>
                    {row.measured ? (
                      <span className="font-semibold tabular-nums">{row.measured}</span>
                    ) : (
                      <Badge tone="neutral">Evaluation pending</Badge>
                    )}
                  </Td>
                  <Td className="text-sm text-muted">{row.measuredBy}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="mt-3 text-xs text-muted">
            A target is marked achieved only when a measurement in this table
            meets it. None are claimed as achieved on the basis of the design
            alone.
          </p>
        </div>
      </section>

      {/* ── Dataset ──────────────────────────────────────────────────────── */}
      <section className="mb-16">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow="Dataset"
            title="The labelled evaluation corpus"
            description="Model accuracy can only be stated against labelled data. This is the status of that data."
          />
        </Reveal>

        <div className="mt-8">
          {benchmark?.dataset ? (
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Labelled pairs", value: benchmark.dataset.pairs },
                { label: "Positive pairs", value: benchmark.dataset.positives },
                { label: "Negative pairs", value: benchmark.dataset.negatives },
                { label: "Pair categories", value: benchmark.dataset.kinds.length },
              ].map((entry) => (
                <Card key={entry.label}>
                  <p className="text-xs text-muted">{entry.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{entry.value}</p>
                </Card>
              ))}
            </div>
          ) : (
            <EvaluationPending
              title="Corpus not yet collected"
              reason="The 200+ labelled assignment pairs described in the proposal have not been collected. Collection requires student consent, anonymisation and departmental approval; the format and the harness that will consume it are already in the repository under data/corpus/."
            />
          )}
        </div>
      </section>

      {/* ── Model benchmark ──────────────────────────────────────────────── */}
      <section className="mb-16">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow="Models"
            title="Three-model benchmark"
            description="Two published sentence-transformers and one fine-tuned on the Ghanaian corpus, compared on the same labelled pairs and the same hardware."
          />
        </Reveal>

        <div className="mt-8 space-y-5">
          {benchmark ? (
            <>
              <ModelComparison models={benchmark.models} />
              {benchmark.platform ? (
                <p className="text-xs text-muted">
                  Measured on Node {benchmark.platform.node} · {benchmark.platform.platform}/
                  {benchmark.platform.arch} · {benchmark.platform.cpus} CPU cores · run{" "}
                  {new Date(benchmark.generatedAt).toLocaleDateString("en-GB")}. Latency and
                  memory are hardware-dependent and should be read as relative, not absolute.
                </p>
              ) : null}
              <div className="grid gap-5">
                {benchmark.models.map((model) => (
                  <ModelDetail key={model.key} model={model} />
                ))}
              </div>
            </>
          ) : (
            <EvaluationPending
              title="Benchmark not yet run"
              reason="Run `npm run benchmark` once the labelled dataset is in place. Precision, recall, F1, accuracy, the confusion matrix, ROC/AUC, latency and memory footprint are all computed by the harness and will appear here automatically."
            />
          )}
        </div>
      </section>

      {/* ── Usability & writing improvement ──────────────────────────────── */}
      <section className="mb-16 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <CardHeader
              title="Usability evaluation (SUS)"
              description="System Usability Scale, administered to students and teaching staff."
              icon={<Gauge className="size-4" />}
            />
            {usability ? (
              <div>
                <p className="text-4xl font-semibold tabular-nums">
                  {usability.meanScore.toFixed(1)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Mean SUS score · {usability.participants} participants · SD{" "}
                  {usability.standardDeviation.toFixed(1)}
                </p>
              </div>
            ) : (
              <EvaluationPending reason="The usability study has not been conducted. No participants have been recruited, and no SUS responses exist." />
            )}
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="h-full">
            <CardHeader
              title="Writing-quality improvement"
              description="Pre/post comparison of writing scores among platform users."
              icon={<FlaskConical className="size-4" />}
            />
            {writing ? (
              <div>
                <p className="text-4xl font-semibold tabular-nums">
                  {writing.meanImprovementPercent.toFixed(1)}%
                </p>
                <p className="mt-1 text-sm text-muted">
                  Mean improvement · {writing.participants} participants ·{" "}
                  {writing.meanBefore.toFixed(1)} → {writing.meanAfter.toFixed(1)}
                  {writing.pValue !== undefined
                    ? ` · ${writing.test ?? "test"} p = ${writing.pValue}`
                    : ""}
                </p>
              </div>
            ) : (
              <EvaluationPending reason="The pre/post writing study has not been conducted. The platform records every writing score it computes, so the data collection is in place — the study itself has not been run." />
            )}
          </Card>
        </Reveal>
      </section>

      {/* ── Ghanaian context ─────────────────────────────────────────────── */}
      <section className="mb-16">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow="Local contribution"
            title="Built for Ghanaian higher education"
            description="Detection thresholds published elsewhere were derived elsewhere. Whether they hold for Ghanaian undergraduate writing is an open question, and it is the question this project exists to answer."
          />
        </Reveal>

        <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
          {GHANA_CONTEXT.map((entry) => (
            <StaggerItem key={entry.title}>
              <Card className="h-full">
                <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <MapPin className="size-5" />
                </span>
                <div className="mb-2">
                  <MaturityBadge status={entry.status as MaturityKey} />
                </div>
                <h3 className="font-semibold">{entry.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{entry.body}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Limitations & future work ────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <CardHeader title="Limitations" icon={<AlertTriangle className="size-4" />} />
            <ul className="space-y-3">
              {LIMITATIONS.map((limitation) => (
                <li key={limitation} className="flex gap-2.5 text-sm text-muted">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-risk-moderate" />
                  {limitation}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="h-full">
            <CardHeader title="Future work" icon={<Layers className="size-4" />} />
            <ul className="space-y-3">
              {FUTURE_WORK.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-muted">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </section>

      <Reveal delay={0.15}>
        <Card className="mt-10">
          <div className="flex gap-3">
            <Database className="size-4 shrink-0 text-brand" />
            <p className="text-sm text-muted">
              The evaluation harness lives at{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
                scripts/benchmark.mjs
              </code>{" "}
              and the corpus specification at{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
                data/corpus/README.md
              </code>
              . Both are part of this repository and can be inspected and re-run.
            </p>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
