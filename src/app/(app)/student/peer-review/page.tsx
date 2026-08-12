import Link from "next/link";
import {
  CheckCircle2, FileText, Inbox, MessageSquare, Plus, Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DOCUMENT_STATUS, type DocumentStatus } from "@/lib/review-exchange";
import { claimReview } from "./actions";
import {
  Alert, Badge, Button, ButtonLink, Card, CardHeader, EmptyState, PageHeader,
  Stat,
} from "@/components/ui";
import { formatDate, relativeTime } from "@/lib/format";

export const metadata = {
  title: "Peer review",
  description:
    "Submit your work for peer feedback, review a classmate's document, and read the feedback you have received.",
};

export default async function PeerReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await requireRole("STUDENT");
  const { submitted } = await searchParams;

  const [myDocuments, toReview, openPool, assignmentReviews] = await Promise.all([
    db.reviewDocument.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        statusDetail: true,
        reviewsRequested: true,
        createdAt: true,
        course: { select: { code: true } },
        reviews: { select: { status: true, overall: true } },
      },
    }),
    db.documentReview.findMany({
      where: { reviewerId: user.id },
      orderBy: [{ status: "asc" }, { assignedAt: "desc" }],
      select: {
        id: true,
        status: true,
        overall: true,
        qualityScore: true,
        assignedAt: true,
        submittedAt: true,
        document: {
          select: {
            id: true,
            title: true,
            wordCount: true,
            course: { select: { code: true } },
          },
        },
      },
    }),
    // Documents nobody has been assigned to yet, that this student may pick up.
    db.reviewDocument.findMany({
      where: {
        ownerId: { not: user.id },
        status: { in: ["OPEN", "IN_REVIEW"] },
        reviews: { none: { reviewerId: user.id } },
      },
      orderBy: { createdAt: "asc" },
      take: 12,
      select: {
        id: true,
        title: true,
        description: true,
        wordCount: true,
        reviewsRequested: true,
        createdAt: true,
        course: { select: { code: true } },
        _count: { select: { reviews: true } },
      },
    }),
    // Reviews a lecturer allocated over assignment submissions. Same job for
    // the student, so it belongs in the same list rather than its own page.
    db.peerReview.findMany({
      where: { reviewerId: user.id },
      orderBy: [{ status: "asc" }, { assignedAt: "desc" }],
      select: {
        id: true,
        status: true,
        dueAt: true,
        assignedAt: true,
        qualityScore: true,
        submission: {
          select: {
            assignment: {
              select: { title: true, course: { select: { code: true } } },
            },
          },
        },
      },
    }),
  ]);

  const available = openPool.filter(
    (document) => document._count.reviews < document.reviewsRequested,
  );

  // Both kinds of review are the same task from the student's point of view.
  const queue = [
    ...toReview.map((review) => ({
      key: `doc-${review.id}`,
      href: `/student/peer-review/review/${review.id}`,
      title: review.document.title,
      meta: `${review.document.wordCount.toLocaleString()} words`,
      courseCode: review.document.course?.code ?? null,
      kind: "Document" as const,
      status: review.status,
      assignedAt: review.assignedAt,
    })),
    ...assignmentReviews.map((review) => ({
      key: `asg-${review.id}`,
      href: `/student/reviews/${review.id}`,
      title: review.submission.assignment.title,
      meta: review.dueAt ? `due ${formatDate(review.dueAt)}` : "no deadline",
      courseCode: review.submission.assignment.course.code,
      kind: "Assignment" as const,
      status: review.status,
      assignedAt: review.assignedAt,
    })),
  ].sort((a, b) => {
    if (a.status !== b.status) return a.status === "ASSIGNED" ? -1 : 1;
    return b.assignedAt.getTime() - a.assignedAt.getTime();
  });

  const pending = queue.filter((review) => review.status === "ASSIGNED");
  const completed = queue.filter((review) => review.status === "SUBMITTED");

  const feedbackReceived = myDocuments.reduce(
    (total, document) =>
      total + document.reviews.filter((review) => review.status === "SUBMITTED").length,
    0,
  );

  return (
    <>
      <PageHeader
        eyebrow="Double-blind"
        title="Peer review"
        description="Put your work up for feedback, review a classmate's document, and read what came back. Authors and reviewers are anonymous to each other."
        action={
          <ButtonLink href="/student/peer-review/new" variant="gradient">
            <Plus className="size-4" />
            Submit a document
          </ButtonLink>
        }
      />

      {submitted ? (
        <Alert tone="success" title="Review submitted">
          Thank you — the author has been notified. Your feedback stays anonymous.
        </Alert>
      ) : null}

      <div className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="My documents"
          value={myDocuments.length}
          hint="Submitted for review"
          icon={<FileText className="size-4" />}
        />
        <Stat
          label="Reviews to complete"
          value={pending.length}
          hint={pending.length === 0 ? "You are all caught up" : "Waiting on you"}
          tone={pending.length > 0 ? "var(--risk-moderate)" : undefined}
          icon={<Inbox className="size-4" />}
        />
        <Stat
          label="Reviews completed"
          value={`${completed.length}/${queue.length}`}
          hint="Your review progress"
          icon={<CheckCircle2 className="size-4" />}
        />
        <Stat
          label="Feedback received"
          value={feedbackReceived}
          hint="Reviews written about your work"
          icon={<MessageSquare className="size-4" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Reviews to complete ────────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Reviews to complete"
            description="Everything waiting on you — classmates' documents and assignment reviews your lecturer allocated. Authors are anonymous."
            icon={<Inbox className="size-4" />}
          />
          {queue.length === 0 ? (
            <EmptyState
              title="No reviews assigned yet"
              description="Submit a document of your own and Lume AI will start pairing you with classmates who need feedback. Reviews your lecturer allocates appear here too."
              image={null}
              action={
                <ButtonLink href="/student/peer-review/new" variant="secondary">
                  Submit a document
                </ButtonLink>
              }
            />
          ) : (
            <ul className="space-y-2">
              {queue.map((review) => (
                <li key={review.key}>
                  <Link
                    href={review.href}
                    className="focus-ring flex items-center gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-border-strong hover:bg-surface-muted/50"
                  >
                    <span
                      className={
                        review.status === "SUBMITTED"
                          ? "flex size-9 shrink-0 items-center justify-center rounded-xl bg-risk-original/12 text-risk-original"
                          : "flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"
                      }
                    >
                      {review.status === "SUBMITTED" ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <FileText className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {review.title}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <Badge tone={review.kind === "Assignment" ? "accent" : "neutral"}>
                          {review.kind}
                        </Badge>
                        {review.courseCode ? <span>{review.courseCode}</span> : null}
                        <span>{review.meta}</span>
                      </span>
                    </span>
                    <Badge tone={review.status === "SUBMITTED" ? "success" : "warning"}>
                      {review.status === "SUBMITTED" ? "Done" : "To do"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ── My submissions ─────────────────────────────────────────── */}
        <Card>
          <CardHeader
            title="My submissions"
            description="Documents you have put up for peer feedback."
            icon={<FileText className="size-4" />}
          />
          {myDocuments.length === 0 ? (
            <EmptyState
              title="You have not submitted anything yet"
              description="Upload a draft and ask classmates for structured feedback before you hand it in."
              image={null}
              action={
                <ButtonLink href="/student/peer-review/new" variant="gradient">
                  <Plus className="size-4" />
                  Submit a document
                </ButtonLink>
              }
            />
          ) : (
            <ul className="space-y-2">
              {myDocuments.map((document) => {
                const done = document.reviews.filter(
                  (review) => review.status === "SUBMITTED",
                ).length;
                const status = DOCUMENT_STATUS[document.status as DocumentStatus];
                return (
                  <li key={document.id}>
                    <Link
                      href={`/student/peer-review/${document.id}`}
                      className="focus-ring block rounded-xl border border-border p-3.5 transition-colors hover:border-border-strong hover:bg-surface-muted/50"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-medium">
                          {document.title}
                        </span>
                        <Badge tone={status?.tone ?? "neutral"}>
                          {status?.label ?? document.status}
                        </Badge>
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                        {document.course ? (
                          <Badge tone="neutral">{document.course.code}</Badge>
                        ) : null}
                        {done}/{document.reviewsRequested} reviews in ·{" "}
                        {formatDate(document.createdAt)}
                      </span>
                      {/* Progress toward the number of reviews requested. */}
                      <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                        <span
                          className="block h-full rounded-full bg-brand transition-[width] duration-700"
                          style={{
                            width: `${Math.min(100, (done / document.reviewsRequested) * 100)}%`,
                          }}
                        />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Open pool ────────────────────────────────────────────────── */}
      <Card className="mt-5">
        <CardHeader
          title="Open for review"
          description="Documents still waiting for a reviewer. Pick one up and it becomes yours to review."
          icon={<Users className="size-4" />}
        />
        {available.length === 0 ? (
          <EmptyState
            title="Nothing waiting right now"
            description="Every document currently up for review already has the reviewers it asked for."
            image={null}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {available.map((document) => (
              <li
                key={document.id}
                className="flex flex-col rounded-xl border border-border p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="min-w-0 text-sm font-medium">{document.title}</p>
                  {document.course ? (
                    <Badge tone="neutral">{document.course.code}</Badge>
                  ) : null}
                </div>
                {document.description ? (
                  <p className="mb-3 line-clamp-2 text-xs text-muted">
                    {document.description}
                  </p>
                ) : null}
                <p className="mb-3 text-xs text-muted">
                  {document.wordCount.toLocaleString()} words ·{" "}
                  {document._count.reviews}/{document.reviewsRequested} reviewers ·{" "}
                  {relativeTime(document.createdAt)}
                </p>
                <form
                  action={async () => {
                    "use server";
                    await claimReview(document.id);
                  }}
                  className="mt-auto"
                >
                  <Button type="submit" variant="secondary" className="w-full">
                    Review this document
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
