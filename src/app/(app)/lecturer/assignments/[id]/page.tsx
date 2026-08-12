import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Stat,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { RiskBadge } from "@/components/similarity-report";
import type { RiskLevel } from "@/lib/risk";
import { formatDateTime } from "@/lib/format";
import { allocatePeerReviews, toggleAssignmentLock } from "../../actions";
import { GradeForm } from "./grade-form";

export default async function LecturerAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("LECTURER");

  const assignment = await db.assignment.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      instructions: true,
      dueAt: true,
      maxMarks: true,
      locked: true,
      allowLate: true,
      peerReviewEnabled: true,
      reviewersPerStudent: true,
      similarityThreshold: true,
      course: {
        select: {
          id: true,
          code: true,
          title: true,
          lecturerId: true,
          _count: { select: { enrollments: true } },
        },
      },
      submissions: {
        where: { isLatest: true },
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          version: true,
          isLate: true,
          status: true,
          grade: true,
          feedback: true,
          wordCount: true,
          submittedAt: true,
          student: { select: { id: true, fullName: true, matricNumber: true } },
          similarityResult: {
            select: { overallScore: true, riskLevel: true, chunksFlagged: true },
          },
          writingFeedback: { select: { overallScore: true } },
          reviewsReceived: {
            select: { id: true, status: true, qualityScore: true },
          },
        },
      },
    },
  });

  if (!assignment || assignment.course.lecturerId !== user.id) notFound();

  const submissions = assignment.submissions;
  const scored = submissions.filter((s) => s.similarityResult);
  const averageSimilarity =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + s.similarityResult!.overallScore, 0) /
        scored.length
      : null;

  const flagged = scored.filter(
    (s) => s.similarityResult!.overallScore >= assignment.similarityThreshold,
  );

  const allReviews = submissions.flatMap((s) => s.reviewsReceived);
  const reviewsDone = allReviews.filter((r) => r.status === "SUBMITTED").length;

  return (
    <>
      <PageHeader
        title={assignment.title}
        description={`${assignment.course.code} — ${assignment.course.title} · due ${formatDateTime(assignment.dueAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            {assignment.peerReviewEnabled ? (
              <form action={allocatePeerReviews}>
                <input type="hidden" name="assignmentId" value={assignment.id} />
                <Button type="submit" variant="secondary">
                  Allocate reviewers
                </Button>
              </form>
            ) : null}
            <form action={toggleAssignmentLock}>
              <input type="hidden" name="assignmentId" value={assignment.id} />
              <Button type="submit" variant={assignment.locked ? "primary" : "secondary"}>
                {assignment.locked ? "Unlock" : "Lock submissions"}
              </Button>
            </form>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Submitted"
          value={`${submissions.length}/${assignment.course._count.enrollments}`}
          hint={`${submissions.filter((s) => s.isLate).length} late`}
        />
        <Stat
          label="Average similarity"
          value={averageSimilarity === null ? "—" : `${averageSimilarity.toFixed(1)}%`}
        />
        <Stat
          label="Above threshold"
          value={flagged.length}
          hint={`Flags at ${assignment.similarityThreshold}%`}
        />
        <Stat
          label="Peer reviews"
          value={allReviews.length === 0 ? "—" : `${reviewsDone}/${allReviews.length}`}
          hint={assignment.peerReviewEnabled ? "completed" : "not enabled"}
        />
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Reports appear here as students submit."
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Submitted</Th>
                <Th>Similarity</Th>
                <Th>Writing</Th>
                <Th>Mark</Th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <Td>
                    <span className="font-medium">{submission.student.fullName}</span>
                    <p className="text-xs text-muted">
                      {submission.student.matricNumber ?? "—"} · v{submission.version}
                    </p>
                  </Td>
                  <Td>
                    <span className="text-sm">
                      {formatDateTime(submission.submittedAt)}
                    </span>
                    {submission.isLate ? (
                      <span className="ml-1.5">
                        <Badge tone="warning">late</Badge>
                      </span>
                    ) : null}
                  </Td>
                  <Td>
                    {submission.similarityResult ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold tabular-nums">
                          {submission.similarityResult.overallScore.toFixed(1)}%
                        </span>
                        <RiskBadge
                          level={submission.similarityResult.riskLevel as RiskLevel}
                        />
                      </div>
                    ) : (
                      <Badge tone="neutral">{submission.status}</Badge>
                    )}
                  </Td>
                  <Td className="tabular-nums">
                    {submission.writingFeedback
                      ? `${submission.writingFeedback.overallScore}/100`
                      : "—"}
                  </Td>
                  <Td>
                    <GradeForm
                      submissionId={submission.id}
                      maxMarks={assignment.maxMarks}
                      grade={submission.grade}
                      feedback={submission.feedback}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Card>
            <CardHeader
              title="Instructions given to students"
              action={
                <Link
                  href="/lecturer/assignments"
                  className="text-sm font-medium text-brand hover:underline"
                >
                  All assignments
                </Link>
              }
            />
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted">
              {assignment.instructions}
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
