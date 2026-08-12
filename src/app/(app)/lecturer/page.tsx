import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Stat,
} from "@/components/ui";
import { RiskBadge } from "@/components/similarity-report";
import { riskLevelFor, type RiskLevel } from "@/lib/risk";
import { relativeTime } from "@/lib/format";

export const metadata = { title: "Dashboard · AI-AIMS" };

export default async function LecturerDashboard() {
  const user = await requireRole("LECTURER");

  const courses = await db.course.findMany({
    where: { lecturerId: user.id },
    select: { id: true, code: true, title: true, _count: { select: { enrollments: true } } },
  });
  const courseIds = courses.map((c) => c.id);

  const submissions =
    courseIds.length > 0
      ? await db.submission.findMany({
          where: { assignment: { courseId: { in: courseIds } }, isLatest: true },
          select: {
            id: true,
            isLate: true,
            grade: true,
            submittedAt: true,
            student: { select: { id: true, fullName: true } },
            assignment: {
              select: {
                id: true,
                title: true,
                similarityThreshold: true,
                course: { select: { code: true } },
              },
            },
            similarityResult: { select: { overallScore: true, riskLevel: true } },
          },
          orderBy: { submittedAt: "desc" },
        })
      : [];

  const [openAssignments, pendingReviews] = await Promise.all([
    courseIds.length > 0
      ? db.assignment.findMany({
          where: { courseId: { in: courseIds }, dueAt: { gte: new Date() } },
          orderBy: { dueAt: "asc" },
          take: 5,
          select: {
            id: true,
            title: true,
            dueAt: true,
            course: { select: { code: true } },
            _count: { select: { submissions: true } },
          },
        })
      : Promise.resolve([]),
    courseIds.length > 0
      ? db.peerReview.count({
          where: {
            status: "ASSIGNED",
            submission: { assignment: { courseId: { in: courseIds } } },
          },
        })
      : Promise.resolve(0),
  ]);

  const scored = submissions.filter((s) => s.similarityResult);
  const averageSimilarity =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + s.similarityResult!.overallScore, 0) /
        scored.length
      : null;

  const lateCount = submissions.filter((s) => s.isLate).length;
  const ungraded = submissions.filter((s) => s.grade === null).length;

  // Students at risk: anyone whose latest work breaches their assignment's
  // configured similarity threshold.
  const atRisk = submissions.filter(
    (s) =>
      s.similarityResult &&
      s.similarityResult.overallScore >= s.assignment.similarityThreshold,
  );

  return (
    <>
      <div data-tour="welcome">
        <PageHeader
          eyebrow="Teaching"
          title="Lecturer dashboard"
          description="Submissions, integrity signals and marking across your courses."
          action={
            <ButtonLink href="/lecturer/assignments" variant="gradient">
              Assignments
            </ButtonLink>
          }
        />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Submissions"
          value={submissions.length}
          hint={`${courses.length} course${courses.length === 1 ? "" : "s"}`}
        />
        <Stat
          label="Average similarity"
          value={averageSimilarity === null ? "—" : `${averageSimilarity.toFixed(1)}%`}
          hint={averageSimilarity === null ? "No reports yet" : undefined}
        />
        <Stat
          label="Awaiting marks"
          value={ungraded}
          hint={`${lateCount} late submission${lateCount === 1 ? "" : "s"}`}
        />
        <Stat
          label="Peer reviews outstanding"
          value={pendingReviews}
        />
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses assigned"
          description="An administrator needs to assign you to a course before you can publish assignments."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card data-tour="stat-at-risk">
            <CardHeader
              title="Students at risk"
              description="Latest submissions at or above the assignment's similarity threshold."
            />
            {atRisk.length === 0 ? (
              <p className="text-sm text-muted">
                No submission currently breaches its threshold.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {atRisk.slice(0, 8).map((submission) => (
                  <li key={submission.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {submission.student.fullName}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {submission.assignment.course.code} ·{" "}
                          {submission.assignment.title}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {submission.similarityResult!.overallScore.toFixed(1)}%
                        </span>
                        <RiskBadge
                          level={submission.similarityResult!.riskLevel as RiskLevel}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Open assignments"
              action={
                <Link
                  href="/lecturer/assignments"
                  className="text-sm font-medium text-brand hover:underline"
                >
                  All
                </Link>
              }
            />
            {openAssignments.length === 0 ? (
              <p className="text-sm text-muted">Nothing currently open.</p>
            ) : (
              <ul className="divide-y divide-border">
                {openAssignments.map((assignment) => (
                  <li key={assignment.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/lecturer/assignments/${assignment.id}`}
                          className="block truncate text-sm font-medium hover:text-brand"
                        >
                          {assignment.title}
                        </Link>
                        <p className="text-xs text-muted">
                          {assignment.course.code} · due{" "}
                          {relativeTime(assignment.dueAt)}
                        </p>
                      </div>
                      <Badge tone="neutral">
                        {assignment._count.submissions} submitted
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Similarity distribution"
              description="Where your students' latest submissions fall across the risk bands."
            />
            <RiskDistribution
              scores={scored.map((s) => s.similarityResult!.overallScore)}
            />
          </Card>
        </div>
      )}
    </>
  );
}

function RiskDistribution({ scores }: { scores: number[] }) {
  if (scores.length === 0) {
    return <p className="text-sm text-muted">No reports yet.</p>;
  }

  const bands: { level: RiskLevel; label: string; color: string }[] = [
    { level: "ORIGINAL", label: "Original (0–15%)", color: "var(--risk-original)" },
    { level: "LOW", label: "Low (16–30%)", color: "var(--risk-low)" },
    { level: "MODERATE", label: "Moderate (31–60%)", color: "var(--risk-moderate)" },
    { level: "HIGH", label: "High (61–80%)", color: "var(--risk-high)" },
    { level: "CRITICAL", label: "Critical (81–100%)", color: "var(--risk-critical)" },
  ];

  const counts = bands.map(
    (band) => scores.filter((score) => riskLevelFor(score) === band.level).length,
  );
  const max = Math.max(...counts, 1);

  return (
    <div className="space-y-2">
      {bands.map((band, i) => (
        <div key={band.level} className="flex items-center gap-3">
          <span className="w-40 shrink-0 text-sm text-muted">{band.label}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-surface-muted">
            <div
              className="h-full rounded"
              style={{
                width: `${(counts[i] / max) * 100}%`,
                background: band.color,
                minWidth: counts[i] > 0 ? "0.5rem" : 0,
              }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm tabular-nums">
            {counts[i]}
          </span>
        </div>
      ))}
    </div>
  );
}
