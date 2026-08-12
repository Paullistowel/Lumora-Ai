import Link from "next/link";
import { AlertTriangle, ScanSearch } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { riskBand, type RiskLevel } from "@/lib/risk";
import {
  Badge, ButtonLink, Card, EmptyState, PageHeader, Stat, Table, Td, Th,
} from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Submissions & similarity reports",
  description:
    "Every submission across the courses you teach, with its similarity score and risk band.",
};

export default async function LecturerSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; risk?: string }>;
}) {
  const user = await requireRole("LECTURER");
  const { course: courseFilter, risk: riskFilter } = await searchParams;

  const courses = await db.course.findMany({
    where: { lecturerId: user.id },
    orderBy: { code: "asc" },
    select: { id: true, code: true, title: true },
  });
  const courseIds = courses.map((c) => c.id);

  const submissions =
    courseIds.length > 0
      ? await db.submission.findMany({
          where: {
            isLatest: true,
            assignment: {
              courseId:
                courseFilter && courseIds.includes(courseFilter)
                  ? courseFilter
                  : { in: courseIds },
            },
            ...(riskFilter && riskFilter !== "ALL"
              ? { similarityResult: { riskLevel: riskFilter } }
              : {}),
          },
          orderBy: { submittedAt: "desc" },
          take: 300,
          select: {
            id: true,
            isLate: true,
            grade: true,
            status: true,
            wordCount: true,
            submittedAt: true,
            student: { select: { fullName: true, matricNumber: true } },
            assignment: {
              select: {
                id: true,
                title: true,
                similarityThreshold: true,
                course: { select: { code: true } },
              },
            },
            similarityResult: {
              select: { overallScore: true, riskLevel: true, chunksFlagged: true },
            },
            writingFeedback: { select: { overallScore: true } },
          },
        })
      : [];

  const scored = submissions.filter((s) => s.similarityResult);
  const averageSimilarity =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + s.similarityResult!.overallScore, 0) / scored.length
      : null;
  const overThreshold = submissions.filter(
    (s) =>
      s.similarityResult &&
      s.similarityResult.overallScore >= s.assignment.similarityThreshold,
  ).length;

  if (courses.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Teaching"
          title="Submissions & similarity reports"
          description="Every submission across the courses you teach."
        />
        <EmptyState
          title="No courses assigned to you yet"
          description="Once a course is assigned to you, its submissions and similarity reports appear here."
          action={<ButtonLink href="/lecturer/courses">View courses</ButtonLink>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Teaching"
        title="Submissions & similarity reports"
        description="Every submission across the courses you teach, with its similarity score, risk band and writing quality."
        action={
          <ButtonLink href="/analyse" variant="secondary">
            <ScanSearch className="size-4" />
            Analyse a document
          </ButtonLink>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Submissions" value={submissions.length} hint="Latest version each" />
        <Stat
          label="Average similarity"
          value={averageSimilarity === null ? "—" : `${averageSimilarity.toFixed(1)}%`}
          hint={averageSimilarity === null ? "No reports yet" : "Across scored work"}
        />
        <Stat
          label="Over threshold"
          value={overThreshold}
          hint="Above the assignment's own limit"
          tone={overThreshold > 0 ? "var(--risk-high)" : undefined}
        />
        <Stat
          label="Awaiting a mark"
          value={submissions.filter((s) => s.grade === null).length}
        />
      </div>

      <form className="mb-5 flex flex-wrap gap-2">
        <select
          name="course"
          defaultValue={courseFilter ?? ""}
          aria-label="Filter by course"
          className="focus-ring rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
        >
          <option value="">All courses</option>
          {courses.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.code} — {entry.title}
            </option>
          ))}
        </select>
        <select
          name="risk"
          defaultValue={riskFilter ?? "ALL"}
          aria-label="Filter by risk band"
          className="focus-ring rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
        >
          {["ALL", "ORIGINAL", "LOW", "MODERATE", "HIGH", "CRITICAL"].map((level) => (
            <option key={level} value={level}>
              {level === "ALL" ? "All risk bands" : riskBand(level as RiskLevel).label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="focus-ring rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-surface-muted"
        >
          Apply
        </button>
      </form>

      {overThreshold > 0 ? (
        <Card className="mb-5 border-risk-moderate/35 bg-risk-moderate/8">
          <div className="flex gap-3">
            <AlertTriangle className="size-4 shrink-0 text-risk-moderate" />
            <p className="text-sm">
              {overThreshold} submission{overThreshold === 1 ? "" : "s"} scored at or
              above the similarity threshold set for the assignment. Similarity is
              evidence to review, not a finding — open the report and read the
              matched passages before acting.
            </p>
          </div>
        </Card>
      ) : null}

      {submissions.length === 0 ? (
        <EmptyState
          title="No submissions match this filter"
          description="Try a different course or risk band."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Student</Th>
              <Th>Assignment</Th>
              <Th>Similarity</Th>
              <Th>Risk</Th>
              <Th>Writing</Th>
              <Th>Submitted</Th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => {
              const result = submission.similarityResult;
              const band = result ? riskBand(result.riskLevel as RiskLevel) : null;
              return (
                <tr key={submission.id} className="hover:bg-surface-muted/50">
                  <Td>
                    <Link
                      href={`/lecturer/assignments/${submission.assignment.id}`}
                      className="focus-ring rounded font-medium hover:text-brand"
                    >
                      {submission.student.fullName}
                    </Link>
                    {submission.student.matricNumber ? (
                      <span className="block text-xs text-muted">
                        {submission.student.matricNumber}
                      </span>
                    ) : null}
                  </Td>
                  <Td className="text-muted">
                    <span className="block">{submission.assignment.title}</span>
                    <span className="text-xs">{submission.assignment.course.code}</span>
                  </Td>
                  <Td>
                    {result ? (
                      <span
                        className="font-semibold tabular-nums"
                        style={{ color: band?.color }}
                      >
                        {result.overallScore.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted">
                        {submission.status === "FAILED" ? "Failed" : "Processing"}
                      </span>
                    )}
                  </Td>
                  <Td>
                    {band ? <Badge tone={band.tone}>{band.label}</Badge> : <span className="text-muted">—</span>}
                  </Td>
                  <Td>
                    {submission.writingFeedback ? (
                      <span className="tabular-nums">
                        {Math.round(submission.writingFeedback.overallScore)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td className="text-muted whitespace-nowrap">
                    {formatDate(submission.submittedAt)}
                    {submission.isLate ? (
                      <Badge tone="warning" className="ml-2">
                        Late
                      </Badge>
                    ) : null}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
