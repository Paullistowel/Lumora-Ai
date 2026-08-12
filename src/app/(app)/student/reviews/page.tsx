import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { formatDateTime, relativeTime } from "@/lib/format";

export const metadata = { title: "Peer reviews · AI-AIMS" };

export default async function ReviewsPage() {
  const user = await requireRole("STUDENT");

  const reviews = await db.peerReview.findMany({
    where: { reviewerId: user.id },
    orderBy: [{ status: "asc" }, { assignedAt: "desc" }],
    select: {
      id: true,
      status: true,
      dueAt: true,
      qualityScore: true,
      submittedAt: true,
      submission: {
        select: {
          assignment: {
            select: { title: true, course: { select: { code: true } } },
          },
        },
      },
    },
  });

  const pending = reviews.filter((r) => r.status === "ASSIGNED");

  return (
    <>
      <PageHeader
        eyebrow="Double-blind"
        title="Peer reviews"
        description="Reviews assigned to you. Authors are anonymous, and so are you."
      />

      {pending.length > 0 ? (
        <p className="mb-4 rounded-lg border border-border bg-brand-soft px-3 py-2 text-sm text-brand">
          You have {pending.length} review{pending.length === 1 ? "" : "s"} to write.
        </p>
      ) : null}

      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews assigned"
          description="When a lecturer enables peer review and allocates reviewers, your assignments appear here."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Assignment</Th>
              <Th>Due</Th>
              <Th>Status</Th>
              <Th>Review quality</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <Td>
                  <span className="font-medium">
                    {review.submission.assignment.title}
                  </span>
                  <p className="text-xs text-muted">
                    {review.submission.assignment.course.code}
                  </p>
                </Td>
                <Td className="text-muted">
                  {review.dueAt ? (
                    <>
                      <span className="text-sm">{formatDateTime(review.dueAt)}</span>
                      <p className="text-xs">{relativeTime(review.dueAt)}</p>
                    </>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  {review.status === "SUBMITTED" ? (
                    <Badge tone="success">Submitted</Badge>
                  ) : review.dueAt && review.dueAt < new Date() ? (
                    <Badge tone="danger">Overdue</Badge>
                  ) : (
                    <Badge tone="warning">To write</Badge>
                  )}
                </Td>
                <Td>
                  {review.qualityScore === null ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <span className="tabular-nums">{review.qualityScore}/100</span>
                  )}
                </Td>
                <Td className="text-right">
                  <Link
                    href={`/student/reviews/${review.id}`}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    {review.status === "SUBMITTED" ? "View" : "Write review"}
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
