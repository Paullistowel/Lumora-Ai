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
import { formatDateTime, relativeTime } from "@/lib/format";
import { riskBand, riskLevelFor, type RiskLevel } from "@/lib/risk";

export const metadata = { title: "Dashboard · AI-AIMS" };

export default async function StudentDashboard() {
  const user = await requireRole("STUDENT");

  const enrollments = await db.enrollment.findMany({
    where: { studentId: user.id },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  const [submissions, upcoming, pendingReviews] = await Promise.all([
    db.submission.findMany({
      where: { studentId: user.id, isLatest: true },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        isLate: true,
        assignment: { select: { title: true, course: { select: { code: true } } } },
        similarityResult: {
          select: { overallScore: true, riskLevel: true },
        },
        writingFeedback: { select: { overallScore: true } },
      },
    }),
    courseIds.length > 0
      ? db.assignment.findMany({
          where: {
            courseId: { in: courseIds },
            dueAt: { gte: new Date() },
            locked: false,
          },
          orderBy: { dueAt: "asc" },
          take: 5,
          select: {
            id: true,
            title: true,
            dueAt: true,
            course: { select: { code: true } },
            submissions: {
              where: { studentId: user.id, isLatest: true },
              select: { id: true },
            },
          },
        })
      : Promise.resolve([]),
    db.peerReview.count({
      where: { reviewerId: user.id, status: "ASSIGNED" },
    }),
  ]);

  const scored = submissions.filter((s) => s.similarityResult);
  const averageSimilarity =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + (s.similarityResult?.overallScore ?? 0), 0) /
        scored.length
      : null;

  const writingScores = submissions
    .filter((s) => s.writingFeedback)
    .map((s) => s.writingFeedback!.overallScore);
  const averageWriting =
    writingScores.length > 0
      ? writingScores.reduce((a, b) => a + b, 0) / writingScores.length
      : null;

  // Chronological order, so "improvement" compares earliest to latest.
  const trend =
    writingScores.length >= 2
      ? writingScores[0] - writingScores[writingScores.length - 1]
      : null;

  return (
    <>
      <div data-tour="welcome">
        <PageHeader
          eyebrow="Your work"
          title={`Welcome back, ${user.fullName.split(" ")[0]}`}
          description="Your submissions, deadlines and originality at a glance."
          action={
            <ButtonLink href="/student/assignments" variant="gradient">
              Submit an assignment
            </ButtonLink>
          }
        />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Submissions" value={submissions.length} />
        <div data-tour="stat-similarity">
        <Stat
          label="Average similarity"
          value={averageSimilarity === null ? "—" : `${averageSimilarity.toFixed(1)}%`}
          hint={
            averageSimilarity === null
              ? "No reports yet"
              : riskBand(riskLevelFor(averageSimilarity)).label
          }
        />
        </div>
        <Stat
          label="Writing score"
          value={averageWriting === null ? "—" : `${averageWriting.toFixed(0)}/100`}
          hint={
            trend === null
              ? undefined
              : trend > 2
                ? `Improved ${trend.toFixed(0)} points`
                : trend < -2
                  ? `Down ${Math.abs(trend).toFixed(0)} points`
                  : "Holding steady"
          }
        />
        <Stat
          label="Reviews to write"
          value={pendingReviews}
          hint={pendingReviews > 0 ? "Awaiting your feedback" : "All caught up"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Upcoming deadlines"
            action={
              <Link
                href="/student/assignments"
                className="text-sm font-medium text-brand hover:underline"
              >
                All
              </Link>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState
              title="Nothing due"
              description={
                courseIds.length === 0
                  ? "Enrol in a course to see its assignments."
                  : "No open assignments right now."
              }
              action={
                courseIds.length === 0 ? (
                  <ButtonLink href="/student/courses" variant="secondary">
                    Browse courses
                  </ButtonLink>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((assignment) => (
                <li key={assignment.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/student/assignments/${assignment.id}`}
                        className="block truncate text-sm font-medium hover:text-brand"
                      >
                        {assignment.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        {assignment.course.code} · due {relativeTime(assignment.dueAt)}
                      </p>
                    </div>
                    {assignment.submissions.length > 0 ? (
                      <Badge tone="success">Submitted</Badge>
                    ) : (
                      <Badge tone="warning">Pending</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent submissions"
            action={
              <Link
                href="/student/submissions"
                className="text-sm font-medium text-brand hover:underline"
              >
                All
              </Link>
            }
          />
          {submissions.length === 0 ? (
            <EmptyState
              title="No submissions yet"
              description="Your originality reports and writing feedback appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {submissions.slice(0, 5).map((submission) => (
                <li key={submission.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/student/submissions/${submission.id}`}
                        className="block truncate text-sm font-medium hover:text-brand"
                      >
                        {submission.assignment.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        {submission.assignment.course.code} ·{" "}
                        {formatDateTime(submission.submittedAt)}
                        {submission.isLate ? " · late" : ""}
                      </p>
                    </div>
                    {submission.similarityResult ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {submission.similarityResult.overallScore.toFixed(1)}%
                        </span>
                        <RiskBadge
                          level={submission.similarityResult.riskLevel as RiskLevel}
                        />
                      </div>
                    ) : (
                      <Badge tone="neutral">
                        {submission.status === "FAILED" ? "Failed" : "Processing"}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
