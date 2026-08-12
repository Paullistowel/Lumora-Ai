import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Alert,
  Badge,
  Card,
  CardHeader,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { formatBytes, formatDateTime, relativeTime } from "@/lib/format";
import { UploadForm } from "./upload-form";

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("STUDENT");

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
      courseId: true,
      course: { select: { code: true, title: true } },
      rubric: {
        select: {
          name: true,
          criteria: {
            orderBy: { order: "asc" },
            select: { id: true, label: true, description: true, maxScore: true },
          },
        },
      },
    },
  });
  if (!assignment) notFound();

  const enrolled = await db.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: user.id, courseId: assignment.courseId },
    },
    select: { id: true },
  });
  if (!enrolled) notFound();

  const submissions = await db.submission.findMany({
    where: { assignmentId: id, studentId: user.id },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      fileName: true,
      fileSize: true,
      isLate: true,
      isLatest: true,
      status: true,
      submittedAt: true,
      similarityResult: { select: { overallScore: true } },
    },
  });

  const overdue = new Date() > assignment.dueAt;
  const closed = assignment.locked || (overdue && !assignment.allowLate);

  return (
    <>
      <PageHeader
        title={assignment.title}
        description={`${assignment.course.code} — ${assignment.course.title}`}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Instructions" />
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {assignment.instructions}
            </div>
          </Card>

          {assignment.rubric ? (
            <Card>
              <CardHeader
                title="Marking rubric"
                description={assignment.rubric.name}
              />
              <ul className="space-y-2">
                {assignment.rubric.criteria.map((criterion) => (
                  <li
                    key={criterion.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{criterion.label}</p>
                      {criterion.description ? (
                        <p className="mt-0.5 text-sm text-muted">
                          {criterion.description}
                        </p>
                      ) : null}
                    </div>
                    <Badge tone="neutral">{criterion.maxScore} pts</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {submissions.length > 0 ? (
            <Card>
              <CardHeader
                title="Your submission history"
                description="Every version is retained; only the latest is checked against the class."
              />
              <Table>
                <thead>
                  <tr>
                    <Th>Version</Th>
                    <Th>File</Th>
                    <Th>Submitted</Th>
                    <Th>Similarity</Th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <Td>
                        <Link
                          href={`/student/submissions/${submission.id}`}
                          className="font-medium hover:text-brand"
                        >
                          v{submission.version}
                        </Link>
                        {submission.isLatest ? (
                          <span className="ml-2">
                            <Badge tone="brand">latest</Badge>
                          </span>
                        ) : null}
                      </Td>
                      <Td className="text-muted">
                        <span className="block max-w-48 truncate">
                          {submission.fileName}
                        </span>
                        <span className="text-xs">
                          {formatBytes(submission.fileSize)}
                        </span>
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
                          <span className="font-semibold tabular-nums">
                            {submission.similarityResult.overallScore.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted">{submission.status}</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader title="Deadline" />
            <p className="text-sm font-medium">{formatDateTime(assignment.dueAt)}</p>
            <p className="mt-0.5 text-sm text-muted">
              {relativeTime(assignment.dueAt)}
            </p>
            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Maximum marks</dt>
                <dd className="font-medium">{assignment.maxMarks}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Late submissions</dt>
                <dd className="font-medium">
                  {assignment.allowLate ? "Accepted" : "Not accepted"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Peer review</dt>
                <dd className="font-medium">
                  {assignment.peerReviewEnabled ? "Enabled" : "Off"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader
              title={submissions.length > 0 ? "Submit a new version" : "Submit your work"}
            />
            {closed ? (
              <Alert tone="error">
                {assignment.locked
                  ? "This assignment is locked."
                  : "The deadline has passed and late submissions are not accepted."}
              </Alert>
            ) : (
              <>
                {overdue ? (
                  <div className="mb-3">
                    <Alert tone="error">
                      The deadline has passed. Your submission will be flagged as
                      late.
                    </Alert>
                  </div>
                ) : null}
                <UploadForm assignmentId={assignment.id} />
              </>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
