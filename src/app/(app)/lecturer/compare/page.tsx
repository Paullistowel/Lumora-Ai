import { GitCompare, Info } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { compareDocuments } from "@/lib/analysis";
import { riskBand } from "@/lib/risk";
import {
  Alert, Badge, Button, Card, CardHeader, EmptyState, PageHeader, ScoreRing,
  Select, Stat,
} from "@/components/ui";

export const metadata = {
  title: "Compare documents",
  description:
    "Compare two submissions paragraph by paragraph and see exactly where they overlap.",
};

const MATCH_LABEL = {
  VERBATIM: "Verbatim",
  NEAR_VERBATIM: "Near-verbatim",
  PARAPHRASE: "Paraphrase",
} as const;

const MATCH_TONE = {
  VERBATIM: "danger",
  NEAR_VERBATIM: "warning",
  PARAPHRASE: "accent",
} as const;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const user = await requireRole("LECTURER");
  const { a, b } = await searchParams;

  const courses = await db.course.findMany({
    where: { lecturerId: user.id },
    select: { id: true },
  });
  const courseIds = courses.map((c) => c.id);

  // Only submissions on this lecturer's own courses are selectable, and the
  // same constraint is re-applied when the two documents are fetched below.
  const options =
    courseIds.length > 0
      ? await db.submission.findMany({
          where: {
            isLatest: true,
            status: "COMPLETE",
            assignment: { courseId: { in: courseIds } },
          },
          orderBy: { submittedAt: "desc" },
          take: 200,
          select: {
            id: true,
            student: { select: { fullName: true } },
            assignment: {
              select: { title: true, course: { select: { code: true } } },
            },
          },
        })
      : [];

  const selected =
    a && b && a !== b
      ? await db.submission.findMany({
          where: {
            id: { in: [a, b] },
            assignment: { courseId: { in: courseIds } },
          },
          select: {
            id: true,
            extractedText: true,
            student: { select: { fullName: true } },
            assignment: {
              select: { title: true, course: { select: { code: true } } },
            },
          },
        })
      : [];

  const docA = selected.find((s) => s.id === a);
  const docB = selected.find((s) => s.id === b);
  const comparison =
    docA && docB
      ? await compareDocuments(docA.extractedText, docB.extractedText)
      : null;

  const band = comparison ? riskBand(comparison.riskLevel) : null;

  return (
    <>
      <PageHeader
        eyebrow="Teaching"
        title="Compare documents"
        description="Put two submissions side by side and see paragraph by paragraph where they overlap — including passages that share meaning but no wording."
      />

      {options.length < 2 ? (
        <EmptyState
          title="At least two analysed submissions are needed"
          description="Once two submissions on your courses have finished processing, you can compare them here."
        />
      ) : (
        <>
          <Card className="mb-6">
            <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">First document</span>
                <Select name="a" defaultValue={a ?? ""}>
                  <option value="">Choose a submission…</option>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.student.fullName} — {option.assignment.course.code}{" "}
                      {option.assignment.title}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Second document</span>
                <Select name="b" defaultValue={b ?? ""}>
                  <option value="">Choose a submission…</option>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.student.fullName} — {option.assignment.course.code}{" "}
                      {option.assignment.title}
                    </option>
                  ))}
                </Select>
              </label>
              <Button type="submit">
                <GitCompare className="size-4" />
                Compare
              </Button>
            </form>

            {a && b && a === b ? (
              <Alert tone="warning">Choose two different submissions.</Alert>
            ) : null}
          </Card>

          {comparison && docA && docB ? (
            <div className="space-y-5">
              <Card>
                <div className="flex flex-wrap items-center gap-8">
                  <ScoreRing
                    value={comparison.overallScore}
                    size={140}
                    colour={band?.color}
                    label={`${comparison.overallScore}%`}
                    caption="overlap"
                  />
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="text-lg font-semibold" style={{ color: band?.color }}>
                        {band?.label}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {docA.student.fullName} vs {docB.student.fullName} —{" "}
                        {comparison.pairs.length} matching passage
                        {comparison.pairs.length === 1 ? "" : "s"} across{" "}
                        {comparison.paragraphsA} paragraphs.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Stat
                        label="Paraphrased"
                        value={
                          comparison.pairs.filter((p) => p.matchType === "PARAPHRASE")
                            .length
                        }
                        hint="Same idea, different words"
                      />
                      <Stat
                        label="Verbatim"
                        value={
                          comparison.pairs.filter((p) => p.matchType === "VERBATIM").length
                        }
                        hint="Shared wording"
                      />
                      <Stat
                        label="Paragraphs"
                        value={`${comparison.paragraphsA} / ${comparison.paragraphsB}`}
                        hint="First / second"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-end gap-0.5 border-t border-border pt-4">
                  {comparison.heat.map((score, index) => (
                    <span
                      key={index}
                      title={`Paragraph ${index + 1}: ${Math.round(score * 100)}%`}
                      className="min-w-[6px] flex-1 rounded-t-sm"
                      style={{
                        height: 8 + score * 40,
                        background:
                          score >= 0.93
                            ? "var(--risk-critical)"
                            : score >= 0.85
                              ? "var(--risk-high)"
                              : score >= 0.75
                                ? "var(--risk-moderate)"
                                : "var(--border)",
                      }}
                    />
                  ))}
                </div>
              </Card>

              {comparison.pairs.length === 0 ? (
                <EmptyState
                  title="No matching passages"
                  description="No paragraph in either document reached the match threshold."
                  image={null}
                />
              ) : (
                <Card>
                  <CardHeader
                    title="Matching passages"
                    description="Strongest matches first. Read both columns before drawing any conclusion."
                    icon={<GitCompare className="size-4" />}
                  />
                  <div className="space-y-4">
                    {comparison.pairs.map((pair, index) => (
                      <div key={index} className="rounded-2xl border border-border p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge tone={MATCH_TONE[pair.matchType]}>
                            {MATCH_LABEL[pair.matchType]}
                          </Badge>
                          <Badge tone="neutral">
                            {Math.round(pair.score * 100)}% semantic
                          </Badge>
                          <Badge tone="neutral">
                            {Math.round(pair.lexicalOverlap * 100)}% shared wording
                          </Badge>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-border bg-surface-muted/40 p-3">
                            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                              {docA.student.fullName} · paragraph {pair.indexA + 1}
                            </p>
                            <p className="text-xs leading-relaxed">{pair.textA}</p>
                          </div>
                          <div className="rounded-xl border border-border bg-surface-muted/40 p-3">
                            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                              {docB.student.fullName} · paragraph {pair.indexB + 1}
                            </p>
                            <p className="text-xs leading-relaxed">{pair.textB}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <div className="flex gap-3">
                  <Info className="size-4 shrink-0 text-brand" />
                  <p className="text-sm text-muted">
                    Two students working from the same reading list will produce
                    overlapping arguments, and correctly quoted material registers
                    as similar by design. Treat this as evidence to discuss, never
                    as a finding of misconduct on its own.
                  </p>
                </div>
              </Card>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
