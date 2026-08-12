import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { RiskBadge } from "@/components/similarity-report";
import type { RiskLevel } from "@/lib/risk";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "My submissions" };

export default async function SubmissionsPage() {
  const user = await requireRole("STUDENT");

  const submissions = await db.submission.findMany({
    where: { studentId: user.id },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      version: true,
      isLate: true,
      isLatest: true,
      status: true,
      submittedAt: true,
      wordCount: true,
      assignment: {
        select: { title: true, course: { select: { code: true } } },
      },
      similarityResult: { select: { overallScore: true, riskLevel: true } },
      writingFeedback: { select: { overallScore: true } },
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="History"
        title="My submissions"
        description="Every version you have submitted, with its originality and writing scores."
      />

      {submissions.length === 0 ? (
        <EmptyState
          title="Nothing submitted yet"
          description="Once you submit an assignment, its reports appear here."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Assignment</Th>
              <Th>Submitted</Th>
              <Th>Similarity</Th>
              <Th>Writing</Th>
              <Th className="text-right">Report</Th>
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
                    {submission.assignment.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {submission.assignment.course.code} · v{submission.version}
                    {submission.isLatest ? "" : " (superseded)"}
                    {submission.wordCount ? ` · ${submission.wordCount} words` : ""}
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
                    <Badge tone="neutral">
                      {submission.status === "FAILED" ? "Failed" : "Processing"}
                    </Badge>
                  )}
                </Td>
                <Td>
                  {submission.writingFeedback ? (
                    <span className="tabular-nums">
                      {submission.writingFeedback.overallScore}/100
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </Td>
                <Td className="text-right">
                  <Link
                    href={`/student/submissions/${submission.id}`}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Open
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
