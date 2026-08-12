import Link from "next/link";
import { LineChart, ScanSearch, TrendingDown, TrendingUp } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ScoreByGroup } from "@/components/analytics/charts";
import {
  Badge, ButtonLink, Card, CardHeader, EmptyState, PageHeader, Stat,
} from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Writing progress",
  description: "How your academic writing scores have moved over time.",
};

export default async function WritingProgressPage() {
  const user = await requireRole("STUDENT");

  const [submissions, analyses] = await Promise.all([
    db.submission.findMany({
      where: { studentId: user.id, isLatest: true, writingFeedback: { isNot: null } },
      orderBy: { submittedAt: "asc" },
      select: {
        id: true,
        submittedAt: true,
        assignment: { select: { title: true, course: { select: { code: true } } } },
        writingFeedback: {
          select: { overallScore: true, academicToneScore: true, readabilityScore: true },
        },
      },
    }),
    db.analysis.findMany({
      where: { userId: user.id, status: "COMPLETE", writingScore: { not: null } },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, createdAt: true, writingScore: true },
    }),
  ]);

  // Both formal submissions and workspace drafts count as evidence of progress,
  // in the order they were written.
  const timeline = [
    ...submissions.map((submission) => ({
      id: submission.id,
      href: `/student/submissions/${submission.id}`,
      label: `${submission.assignment.course.code} · ${submission.assignment.title}`,
      kind: "Submission" as const,
      at: submission.submittedAt,
      score: submission.writingFeedback!.overallScore,
      tone: submission.writingFeedback!.academicToneScore,
    })),
    ...analyses.map((analysis) => ({
      id: analysis.id,
      href: `/analyse/${analysis.id}`,
      label: analysis.title,
      kind: "Draft analysis" as const,
      at: analysis.createdAt,
      score: analysis.writingScore!,
      tone: null,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  if (timeline.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Your writing"
          title="Writing progress"
          description="How your academic writing scores have moved over time."
        />
        <EmptyState
          title="No writing scores yet"
          description="Submit an assignment, or analyse a draft in the workspace, and your scores will start collecting here."
          action={
            <ButtonLink href="/analyse" variant="gradient">
              <ScanSearch className="size-4" />
              Analyse a draft
            </ButtonLink>
          }
        />
      </>
    );
  }

  const latest = timeline[timeline.length - 1];
  const first = timeline[0];
  const change = timeline.length > 1 ? latest.score - first.score : null;
  const average =
    timeline.reduce((sum, entry) => sum + entry.score, 0) / timeline.length;

  return (
    <>
      <PageHeader
        eyebrow="Your writing"
        title="Writing progress"
        description="Every piece of work Lume AI has scored, in the order you wrote it. Scores are computed the same way each time, so they are comparable."
        action={
          <ButtonLink href="/analyse" variant="secondary">
            <ScanSearch className="size-4" />
            Analyse a draft
          </ButtonLink>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Latest score" value={Math.round(latest.score)} hint="out of 100" />
        <Stat label="Average" value={Math.round(average)} hint={`across ${timeline.length} pieces`} />
        <Stat
          label="Change since first"
          value={
            change === null
              ? "—"
              : `${change >= 0 ? "+" : ""}${Math.round(change)}`
          }
          hint={change === null ? "Needs a second piece" : "points"}
          tone={
            change === null
              ? undefined
              : change >= 0
                ? "var(--risk-original)"
                : "var(--risk-high)"
          }
          icon={
            change === null ? null : change >= 0 ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )
          }
        />
        <Stat label="Pieces scored" value={timeline.length} hint="Submissions and drafts" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader
            title="Your writing timeline"
            description="Oldest first. Open any entry to see what the feedback said."
            icon={<LineChart className="size-4" />}
          />
          <ol className="space-y-2">
            {timeline.map((entry, index) => {
              const previous = index > 0 ? timeline[index - 1].score : null;
              const delta = previous === null ? null : entry.score - previous;
              return (
                <li key={`${entry.kind}-${entry.id}`}>
                  <Link
                    href={entry.href}
                    className="focus-ring flex items-center gap-4 rounded-xl border border-border p-3.5 transition-colors hover:border-border-strong hover:bg-surface-muted/50"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-semibold text-brand tabular-nums">
                      {Math.round(entry.score)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {entry.label}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <Badge tone={entry.kind === "Submission" ? "brand" : "neutral"}>
                          {entry.kind}
                        </Badge>
                        {formatDate(entry.at)}
                      </span>
                    </span>
                    {delta !== null && Math.round(delta) !== 0 ? (
                      <span
                        className="shrink-0 text-xs font-semibold tabular-nums"
                        style={{
                          color:
                            delta > 0 ? "var(--risk-original)" : "var(--risk-high)",
                        }}
                      >
                        {delta > 0 ? "+" : ""}
                        {Math.round(delta)}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="space-y-5">
          <ScoreByGroup
            title="Scores in order"
            description="Each bar is one piece of work, oldest at the top."
            data={timeline.map((entry) => ({
              label: entry.label,
              value: Math.round(entry.score),
            }))}
          />

          <Card>
            <p className="text-xs text-muted">
              A writing score summarises readability, academic tone, structure and
              correctness. It is a guide to what to work on next, not a mark — your
              lecturer&apos;s grade is the assessment that counts.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
