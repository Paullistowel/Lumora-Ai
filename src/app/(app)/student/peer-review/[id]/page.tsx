import { notFound } from "next/navigation";
import {
  ArrowLeft, Clock, Download, MessageSquare, RefreshCw, Star, ThumbsUp,
  Trash2, Wrench,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  DOCUMENT_STATUS, MAX_RATING, REVIEW_CRITERIA, averageRating, parseRatings,
  type DocumentStatus,
} from "@/lib/review-exchange";
import { deleteReviewDocument, requestMoreReviewers } from "../actions";
import {
  Alert, Badge, Button, ButtonLink, Card, CardHeader, EmptyState, PageHeader,
  ScoreRing, cn,
} from "@/components/ui";
import { formatBytes, formatDateTime } from "@/lib/format";

export const metadata = { title: "My document" };

export default async function ReviewDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("STUDENT");
  const { id } = await params;

  const document = await db.reviewDocument.findUnique({
    where: { id },
    include: {
      course: { select: { code: true, title: true } },
      reviews: {
        orderBy: { submittedAt: "asc" },
        select: {
          id: true,
          status: true,
          ratings: true,
          overall: true,
          strengths: true,
          improvements: true,
          comment: true,
          qualityScore: true,
          submittedAt: true,
        },
      },
    },
  });

  // A review document belongs to its author; reviewers reach it through their
  // own review, never through this route.
  if (!document || document.ownerId !== user.id) notFound();

  const submitted = document.reviews.filter((review) => review.status === "SUBMITTED");
  const status = DOCUMENT_STATUS[document.status as DocumentStatus];

  // Average per criterion across every review received.
  const criterionAverages = REVIEW_CRITERIA.map((criterion) => {
    const scores = submitted
      .map((review) => parseRatings(review.ratings)[criterion.key])
      .filter((score): score is number => typeof score === "number");
    return {
      ...criterion,
      average:
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : null,
      count: scores.length,
    };
  });

  const overall =
    submitted.length > 0
      ? Math.round(
          (submitted.reduce((sum, review) => sum + (review.overall ?? 0), 0) /
            submitted.length) *
            10,
        ) / 10
      : null;

  return (
    <>
      <PageHeader
        eyebrow="Peer review"
        title={document.title}
        description={`${document.fileName} · ${formatBytes(document.fileSize)} · ${document.wordCount.toLocaleString()} words · ${formatDateTime(document.createdAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/student/peer-review" variant="secondary">
              <ArrowLeft className="size-4" />
              Back
            </ButtonLink>
            <ButtonLink
              href={`/api/files/review-document/${document.id}`}
              variant="secondary"
            >
              <Download className="size-4" />
              Download
            </ButtonLink>
            <form
              action={async () => {
                "use server";
                await deleteReviewDocument(id);
              }}
            >
              <Button type="submit" variant="ghost" aria-label="Delete this document">
                <Trash2 className="size-4" />
              </Button>
            </form>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={status?.tone ?? "neutral"}>{status?.label ?? document.status}</Badge>
        {document.course ? <Badge tone="neutral">{document.course.code}</Badge> : null}
        <Badge tone="neutral">
          {submitted.length}/{document.reviewsRequested} reviews received
        </Badge>
      </div>

      {document.status === "FAILED" ? (
        <Alert tone="error" title="This document could not be read">
          {document.statusDetail ??
            "The file could not be processed. Upload a different version."}
        </Alert>
      ) : null}

      {document.status === "PENDING" || document.status === "PROCESSING" ? (
        <Alert tone="info" title="Preparing your document">
          Lume AI is extracting the text so reviewers can read it. Refresh in a
          moment.
        </Alert>
      ) : null}

      {document.description ? (
        <Card className="mb-5">
          <CardHeader title="What you asked reviewers to focus on" />
          <p className="text-sm whitespace-pre-wrap">{document.description}</p>
        </Card>
      ) : null}

      {submitted.length === 0 ? (
        <Card>
          <CardHeader
            title="Feedback"
            description="Nothing has come back yet."
            icon={<Clock className="size-4" />}
          />
          <EmptyState
            title="No reviews received yet"
            description={
              document.reviews.length > 0
                ? `${document.reviews.length} reviewer${document.reviews.length === 1 ? " has" : "s have"} been assigned and are reading. You will be notified as each review arrives.`
                : "No reviewer has picked this up yet. It is visible in the open pool for your classmates."
            }
            action={
              <form
                action={async () => {
                  "use server";
                  await requestMoreReviewers(id);
                }}
              >
                <Button type="submit" variant="secondary">
                  <RefreshCw className="size-4" />
                  Look for reviewers again
                </Button>
              </form>
            }
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {/* ── Summary ─────────────────────────────────────────────── */}
          <Card>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="flex items-center gap-6">
                <ScoreRing
                  value={overall ?? 0}
                  max={MAX_RATING}
                  size={140}
                  colour="var(--brand)"
                  label={`${overall ?? "—"}`}
                  caption={`of ${MAX_RATING}`}
                />
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    Peer rating
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {overall !== null && overall >= 4
                      ? "Strong"
                      : overall !== null && overall >= 3
                        ? "Solid"
                        : "Needs work"}
                  </p>
                  <p className="mt-2 max-w-[16rem] text-xs text-muted">
                    Averaged across {submitted.length} anonymous review
                    {submitted.length === 1 ? "" : "s"}.
                  </p>
                </div>
              </div>

              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                {criterionAverages.map((criterion) => (
                  <div
                    key={criterion.key}
                    className="rounded-xl border border-border bg-surface-muted/40 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">{criterion.label}</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {criterion.average ?? "—"}
                      </p>
                    </div>
                    <div className="mt-2 flex gap-0.5" aria-hidden>
                      {Array.from({ length: MAX_RATING }, (_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-3",
                            criterion.average !== null && i < Math.round(criterion.average)
                              ? "fill-risk-moderate text-risk-moderate"
                              : "text-border-strong",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Individual reviews ──────────────────────────────────── */}
          {submitted.map((review, index) => {
            const ratings = parseRatings(review.ratings);
            const average = averageRating(ratings);
            return (
              <Card key={review.id}>
                <CardHeader
                  title={`Anonymous reviewer ${index + 1}`}
                  description={
                    review.submittedAt
                      ? `Submitted ${formatDateTime(review.submittedAt)}`
                      : undefined
                  }
                  icon={<MessageSquare className="size-4" />}
                  action={
                    <div className="flex items-center gap-2">
                      {average !== null ? (
                        <Badge tone="brand">
                          {average} / {MAX_RATING}
                        </Badge>
                      ) : null}
                      {review.qualityScore !== null ? (
                        <Badge
                          tone={
                            review.qualityScore >= 70
                              ? "success"
                              : review.qualityScore >= 45
                                ? "warning"
                                : "neutral"
                          }
                        >
                          Review quality {Math.round(review.qualityScore)}
                        </Badge>
                      ) : null}
                    </div>
                  }
                />

                <div className="mb-4 grid gap-2 sm:grid-cols-3">
                  {REVIEW_CRITERIA.map((criterion) => (
                    <div
                      key={criterion.key}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <span className="text-xs text-muted">{criterion.label}</span>
                      <span className="text-xs font-semibold tabular-nums">
                        {ratings[criterion.key] ?? "—"}/{MAX_RATING}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {review.strengths ? (
                    <div className="rounded-xl border border-risk-original/30 bg-risk-original/8 p-3.5">
                      <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-risk-original uppercase">
                        <ThumbsUp className="size-3.5" />
                        What is working
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{review.strengths}</p>
                    </div>
                  ) : null}

                  {review.improvements ? (
                    <div className="rounded-xl border border-risk-moderate/30 bg-risk-moderate/8 p-3.5">
                      <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-risk-moderate uppercase">
                        <Wrench className="size-3.5" />
                        What to change
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {review.improvements}
                      </p>
                    </div>
                  ) : null}

                  {review.comment ? (
                    <div className="rounded-xl border border-border p-3.5">
                      <p className="mb-1.5 text-xs font-semibold text-muted uppercase">
                        Other comments
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}

          {submitted.length < document.reviewsRequested ? (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  {document.reviewsRequested - submitted.length} more review
                  {document.reviewsRequested - submitted.length === 1 ? "" : "s"}{" "}
                  still to come.
                </p>
                <form
                  action={async () => {
                    "use server";
                    await requestMoreReviewers(id);
                  }}
                >
                  <Button type="submit" variant="secondary">
                    <RefreshCw className="size-4" />
                    Look for reviewers again
                  </Button>
                </form>
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </>
  );
}
