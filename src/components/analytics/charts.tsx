"use client";

import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { EmptyState, cn } from "@/components/ui";
import { RISK_BANDS, type RiskLevel } from "@/lib/risk";

/**
 * Chart primitives for the lecturer analytics screens.
 *
 * Two rules shape everything here:
 *
 * 1. Colour is never the sole carrier of meaning. The five risk bands are too
 *    close under deuteranopia to be told apart by hue, so every band is
 *    directly labelled and colour only reinforces the label.
 * 2. Every chart is a single series. There is no second y-axis anywhere, and
 *    no categorical palette to mis-assign.
 */

const AXIS = { fontSize: 11, fill: "var(--muted)" } as const;

function ChartTooltip({
  active,
  payload,
  label,
  unit = "",
}: {
  active?: boolean;
  payload?: { value: number; payload: Record<string, unknown> }[];
  label?: string | number;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-[var(--shadow-md)]">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-muted">
        <span className="font-semibold tabular-nums text-foreground">
          {payload[0].value}
        </span>
        {unit}
      </p>
    </div>
  );
}

export function ChartFrame({
  title,
  description,
  children,
  empty,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-sm)]">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      <div className="mt-4">
        {empty ? (
          <EmptyState
            title="Not enough data yet"
            description="This chart fills in as submissions are analysed."
            image={null}
          />
        ) : (
          children
        )}
      </div>
    </section>
  );
}

/** Distribution of similarity scores in ten-point bins. One series, one hue. */
export function SimilarityDistribution({
  scores,
}: {
  scores: number[];
}) {
  const bins = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}–${i * 10 + 10}%`,
    count: 0,
  }));
  for (const score of scores) {
    const index = Math.min(9, Math.floor(score / 10));
    bins[index].count++;
  }

  return (
    <ChartFrame
      title="Similarity distribution"
      description="How many submissions fall in each ten-point band."
      empty={scores.length === 0}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={bins} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={AXIS}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={54}
          />
          <YAxis
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-muted)" }}
            content={<ChartTooltip unit=" submissions" />}
          />
          <Bar
            dataKey="count"
            fill="var(--brand)"
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/**
 * Risk bands as a labelled stacked bar. Every band carries its own text label
 * and count, so the chart survives colour-vision deficiency and greyscale print.
 */
export function RiskBreakdown({
  counts,
}: {
  counts: Record<RiskLevel, number>;
}) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <ChartFrame
      title="Risk bands"
      description="Submissions grouped by the risk band Lume AI assigned."
      empty={total === 0}
    >
      <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full">
        {RISK_BANDS.map((band) => {
          const share = total > 0 ? (counts[band.level] / total) * 100 : 0;
          if (share === 0) return null;
          return (
            <div
              key={band.level}
              style={{ width: `${share}%`, background: band.color }}
              className="h-full first:rounded-l-full last:rounded-r-full"
              title={`${band.label}: ${counts[band.level]}`}
            />
          );
        })}
      </div>

      <ul className="mt-5 space-y-2">
        {RISK_BANDS.map((band) => {
          const count = counts[band.level];
          const share = total > 0 ? (count / total) * 100 : 0;
          return (
            <li key={band.level} className="flex items-center gap-3 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ background: band.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{band.label}</span>
              <span className="tabular-nums text-muted">
                {count} · {share.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </ChartFrame>
  );
}

/** Horizontal single-series bars with the value labelled directly. */
export function ScoreByGroup({
  title,
  description,
  data,
  unit = "",
  max = 100,
}: {
  title: string;
  description?: string;
  data: { label: string; value: number }[];
  unit?: string;
  max?: number;
}) {
  return (
    <ChartFrame title={title} description={description} empty={data.length === 0}>
      <ul className="space-y-3">
        {data.map((entry) => (
          <li key={entry.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{entry.label}</span>
              <span className="shrink-0 font-semibold tabular-nums">
                {entry.value}
                {unit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-700"
                style={{ width: `${Math.min(100, (entry.value / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}

/** Compact tabular fallback so every chart has a text equivalent. */
export function DataTable({
  caption,
  columns,
  rows,
  className,
}: {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
  className?: string;
}) {
  return (
    <details className={cn("rounded-2xl border border-border bg-surface p-4", className)}>
      <summary className="focus-ring cursor-pointer rounded text-sm font-medium">
        {caption}
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="border-b border-border px-3 py-2 text-left text-xs font-semibold tracking-wide text-muted uppercase"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border-b border-border px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export { Cell };
