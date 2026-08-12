"use client";

import { Clock } from "lucide-react";
import { Badge, Card, cn } from "@/components/ui";
import type { ModelResult } from "@/lib/research";

/**
 * Renders measured evaluation output. Every component here has an explicit
 * "pending" branch: when the benchmark has not been run, the reader sees why,
 * never a placeholder number.
 */

export function EvaluationPending({
  title = "Evaluation pending",
  reason,
  className,
}: {
  title?: string;
  reason: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-surface-muted/50 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-surface text-muted">
        <Clock className="size-5" />
      </span>
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">{reason}</p>
    </div>
  );
}

/** Confusion matrix as a labelled 2×2 grid. Cell shading is reinforcement only. */
export function ConfusionMatrix({
  confusion,
}: {
  confusion: { tp: number; fp: number; tn: number; fn: number };
}) {
  const total = confusion.tp + confusion.fp + confusion.tn + confusion.fn;
  const cells = [
    { label: "True positive", value: confusion.tp, hint: "Derived pair, correctly flagged", good: true },
    { label: "False positive", value: confusion.fp, hint: "Independent pair, wrongly flagged", good: false },
    { label: "False negative", value: confusion.fn, hint: "Derived pair, missed", good: false },
    { label: "True negative", value: confusion.tn, hint: "Independent pair, correctly cleared", good: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className={cn(
            "rounded-xl border p-4",
            cell.good
              ? "border-risk-original/30 bg-risk-original/8"
              : "border-risk-high/30 bg-risk-high/8",
          )}
        >
          <p className="text-xs font-medium text-muted">{cell.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{cell.value}</p>
          <p className="mt-0.5 text-[11px] text-muted">
            {total > 0 ? `${((cell.value / total) * 100).toFixed(1)}% · ` : ""}
            {cell.hint}
          </p>
        </div>
      ))}
    </div>
  );
}

/** ROC curve drawn as an inline SVG — one series, no library, no colour coding. */
export function RocCurve({
  points,
  auc,
}: {
  points: { fpr: number; tpr: number }[];
  auc: number;
}) {
  const size = 260;
  const pad = 28;
  const plot = size - pad * 2;

  const sorted = [...points].sort((a, b) => a.fpr - b.fpr);
  const path = sorted
    .map((point, index) => {
      const x = pad + point.fpr * plot;
      const y = pad + (1 - point.tpr) * plot;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <figure>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[280px]"
        role="img"
        aria-label={`Receiver operating characteristic curve with area under curve ${auc}`}
      >
        <rect
          x={pad}
          y={pad}
          width={plot}
          height={plot}
          fill="none"
          stroke="var(--border)"
        />
        {/* Chance line */}
        <line
          x1={pad}
          y1={pad + plot}
          x2={pad + plot}
          y2={pad}
          stroke="var(--border-strong)"
          strokeDasharray="4 4"
        />
        <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2" />
        <text x={pad} y={size - 6} fontSize="10" fill="var(--muted)">
          False positive rate →
        </text>
        <text
          x={-size + 6}
          y={12}
          fontSize="10"
          fill="var(--muted)"
          transform="rotate(-90)"
        >
          True positive rate →
        </text>
      </svg>
      <figcaption className="mt-2 text-sm">
        <span className="font-semibold tabular-nums">AUC {auc.toFixed(3)}</span>
        <span className="ml-2 text-muted">
          The dashed diagonal is chance. Further above it is better.
        </span>
      </figcaption>
    </figure>
  );
}

/** Side-by-side comparison of the three candidate models. */
export function ModelComparison({ models }: { models: ModelResult[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[var(--shadow-sm)]">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <caption className="sr-only">
          Benchmark comparison of the three candidate embedding models
        </caption>
        <thead>
          <tr>
            {["Model", "Dim", "Precision", "Recall", "F1", "AUC", "Latency", "Memory"].map(
              (heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="border-b border-border bg-surface-muted/60 px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase"
                >
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.key}>
              <td className="border-b border-border px-4 py-3.5">
                <span className="block font-medium">{model.label}</span>
                <span className="block text-xs text-muted">{model.key}</span>
              </td>
              <td className="border-b border-border px-4 py-3.5 tabular-nums">
                {model.dimensions}
              </td>
              {model.status === "pending" ? (
                <td colSpan={6} className="border-b border-border px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">Evaluation pending</Badge>
                    <span className="text-xs text-muted">{model.reason}</span>
                  </div>
                </td>
              ) : (
                <>
                  <td className="border-b border-border px-4 py-3.5 font-semibold tabular-nums">
                    {(model.metrics.precision * 100).toFixed(1)}%
                  </td>
                  <td className="border-b border-border px-4 py-3.5 tabular-nums">
                    {(model.metrics.recall * 100).toFixed(1)}%
                  </td>
                  <td className="border-b border-border px-4 py-3.5 tabular-nums">
                    {(model.metrics.f1 * 100).toFixed(1)}%
                  </td>
                  <td className="border-b border-border px-4 py-3.5 tabular-nums">
                    {model.auc.toFixed(3)}
                  </td>
                  <td className="border-b border-border px-4 py-3.5 tabular-nums">
                    {model.latency.meanMsPerPair.toFixed(0)}ms
                  </td>
                  <td className="border-b border-border px-4 py-3.5 tabular-nums">
                    {model.memory.peakRssMb}MB
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Per-model detail: confusion matrix and ROC, only where measured. */
export function ModelDetail({ model }: { model: ModelResult }) {
  if (model.status === "pending") {
    return (
      <Card>
        <h3 className="font-semibold">{model.label}</h3>
        <EvaluationPending className="mt-4" reason={model.reason} />
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">{model.label}</h3>
          <p className="text-xs text-muted">
            Threshold {model.threshold} · best F1 at {model.bestThreshold.threshold}
          </p>
        </div>
        <Badge tone="success">Measured</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
            Confusion matrix
          </p>
          <ConfusionMatrix confusion={model.confusion} />
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
            ROC curve
          </p>
          <RocCurve points={model.roc} auc={model.auc} />
        </div>
      </div>

      <dl className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
        {[
          { label: "Mean latency", value: `${model.latency.meanMsPerPair.toFixed(1)} ms/pair` },
          { label: "95th percentile", value: `${model.latency.p95MsPerPair.toFixed(1)} ms/pair` },
          { label: "Peak memory", value: `${model.memory.peakRssMb} MB RSS` },
        ].map((entry) => (
          <div key={entry.label}>
            <dt className="text-xs text-muted">{entry.label}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
