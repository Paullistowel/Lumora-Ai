import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { RiskLevel } from "@/lib/risk";
import {
  DataTable, RiskBreakdown, ScoreByGroup, SimilarityDistribution,
} from "@/components/analytics/charts";
import { Card, EmptyState, ButtonLink, PageHeader, Stat } from "@/components/ui";

export const metadata = {
  title: "Class analytics",
  description:
    "Similarity distribution, risk bands, writing quality and completion across the courses you teach.",
};

export default async function LecturerAnalyticsPage() {
  const user = await requireRole("LECTURER");

  const courses = await db.course.findMany({
    where: { lecturerId: user.id },
    select: { id: true, code: true, title: true, _count: { select: { enrollments: true } } },
  });
  const courseIds = courses.map((c) => c.id);

  if (courseIds.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Teaching"
          title="Class analytics"
          description="Cohort-level integrity and writing signals across your courses."
        />
        <EmptyState
          title="No courses assigned to you yet"
          description="Analytics appear once you are teaching a course with submissions."
          action={<ButtonLink href="/lecturer/courses">View courses</ButtonLink>}
        />
      </>
    );
  }

  const [assignments, submissions, reviews] = await Promise.all([
    db.assignment.findMany({
      where: { courseId: { in: courseIds } },
      select: {
        id: true,
        title: true,
        courseId: true,
        course: { select: { code: true, _count: { select: { enrollments: true } } } },
        _count: { select: { submissions: true } },
      },
    }),
    db.submission.findMany({
      where: { assignment: { courseId: { in: courseIds } }, isLatest: true },
      select: {
        id: true,
        assignmentId: true,
        similarityResult: { select: { overallScore: true, riskLevel: true } },
        writingFeedback: { select: { overallScore: true } },
      },
    }),
    db.peerReview.findMany({
      where: { submission: { assignment: { courseId: { in: courseIds } } } },
      select: { status: true, qualityScore: true },
    }),
  ]);

  const scores = submissions
    .map((s) => s.similarityResult?.overallScore)
    .filter((score): score is number => typeof score === "number");

  const riskCounts: Record<RiskLevel, number> = {
    ORIGINAL: 0,
    LOW: 0,
    MODERATE: 0,
    HIGH: 0,
    CRITICAL: 0,
  };
  for (const submission of submissions) {
    const level = submission.similarityResult?.riskLevel as RiskLevel | undefined;
    if (level && level in riskCounts) riskCounts[level]++;
  }

  const writingScores = submissions
    .map((s) => s.writingFeedback?.overallScore)
    .filter((score): score is number => typeof score === "number");

  const averageSimilarity =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const averageWriting =
    writingScores.length > 0
      ? writingScores.reduce((a, b) => a + b, 0) / writingScores.length
      : null;

  // Completion per assignment: submissions received against students enrolled.
  const completion = assignments
    .map((assignment) => {
      const enrolled = assignment.course._count.enrollments;
      return {
        label: `${assignment.course.code} · ${assignment.title}`,
        value:
          enrolled > 0
            ? Math.round((assignment._count.submissions / enrolled) * 100)
            : 0,
        received: assignment._count.submissions,
        enrolled,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Average similarity per assignment — the cohort-level signal that matters.
  const perAssignment = assignments
    .map((assignment) => {
      const relevant = submissions.filter(
        (s) => s.assignmentId === assignment.id && s.similarityResult,
      );
      if (relevant.length === 0) return null;
      const average =
        relevant.reduce((sum, s) => sum + s.similarityResult!.overallScore, 0) /
        relevant.length;
      return {
        label: `${assignment.course.code} · ${assignment.title}`,
        value: Math.round(average * 10) / 10,
      };
    })
    .filter((entry): entry is { label: string; value: number } => entry !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const reviewsSubmitted = reviews.filter((r) => r.status === "SUBMITTED").length;
  const reviewQuality = reviews
    .map((r) => r.qualityScore)
    .filter((score): score is number => typeof score === "number");

  return (
    <>
      <PageHeader
        eyebrow="Teaching"
        title="Class analytics"
        description="Cohort-level integrity and writing signals across the courses you teach. Every figure is computed from submissions on this server."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Submissions analysed"
          value={scores.length}
          hint={`of ${submissions.length} received`}
        />
        <Stat
          label="Average similarity"
          value={averageSimilarity === null ? "—" : `${averageSimilarity.toFixed(1)}%`}
          hint={averageSimilarity === null ? "No reports yet" : "Across scored work"}
        />
        <Stat
          label="Average writing score"
          value={averageWriting === null ? "—" : Math.round(averageWriting)}
          hint={averageWriting === null ? "No feedback yet" : "out of 100"}
        />
        <Stat
          label="Peer reviews completed"
          value={reviews.length === 0 ? "—" : `${reviewsSubmitted}/${reviews.length}`}
          hint={
            reviewQuality.length > 0
              ? `avg quality ${Math.round(
                  reviewQuality.reduce((a, b) => a + b, 0) / reviewQuality.length,
                )}`
              : "No reviews assigned"
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SimilarityDistribution scores={scores} />
        <RiskBreakdown counts={riskCounts} />
        <ScoreByGroup
          title="Average similarity by assignment"
          description="Highest first. A whole cohort scoring high usually points at the prompt, not the students."
          data={perAssignment}
          unit="%"
        />
        <ScoreByGroup
          title="Submission completion"
          description="Submissions received against students enrolled on the course."
          data={completion.map(({ label, value }) => ({ label, value }))}
          unit="%"
        />
      </div>

      <div className="mt-5 grid gap-4">
        <DataTable
          caption="View the similarity figures as a table"
          columns={["Assignment", "Average similarity"]}
          rows={perAssignment.map((entry) => [entry.label, `${entry.value}%`])}
        />
        <DataTable
          caption="View completion as a table"
          columns={["Assignment", "Received", "Enrolled", "Completion"]}
          rows={completion.map((entry) => [
            entry.label,
            entry.received,
            entry.enrolled,
            `${entry.value}%`,
          ])}
        />
      </div>

      <Card className="mt-6">
        <p className="text-xs text-muted">
          These analytics describe what the platform has measured on your own
          courses. They are not benchmark results: how accurately the underlying
          model detects plagiarism is a separate question, answered on the{" "}
          <ButtonLink href="/research" variant="ghost" className="px-1 py-0 text-xs">
            research and evaluation
          </ButtonLink>{" "}
          page.
        </p>
      </Card>
    </>
  );
}
