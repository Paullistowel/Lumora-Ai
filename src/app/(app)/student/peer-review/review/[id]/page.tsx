import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Star } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  MAX_RATING, REVIEW_CRITERIA, averageRating, parseRatings,
} from "@/lib/review-exchange";
import { DocumentViewer } from "@/components/peer-review/document-viewer";
import { DocumentReviewForm } from "@/components/peer-review/review-form";
import {
  Alert, Badge, ButtonLink, Card, CardHeader, PageHeader, cn,
} from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Review a document" };

export default async function ReviewWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("STUDENT");
  const { id } = await params;

  const review = await db.documentReview.findUnique({
    where: { id },
    select: {
      id: true,
      reviewerId: true,
      status: true,
      ratings: true,
      strengths: true,
      improvements: true,
      comment: true,
      qualityScore: true,
      submittedAt: true,
      document: {
        select: {
          id: true,
          title: true,
          description: true,
          extractedText: true,
          wordCount: true,
          status: true,
          course: { select: { code: true, title: true } },
        },
      },
    },
  });

  // A review belongs to its reviewer. The author's identity is never selected
  // above, so it cannot leak into this page even by accident.
  if (!review || review.reviewerId !== user.id) notFound();

  const done = review.status === "SUBMITTED";
  const ratings = parseRatings(review.ratings);
  const average = averageRating(ratings);

  return (
    <>
      <PageHeader
        eyebrow="Double-blind peer review"
        title={review.document.title}
        description={
          review.document.course
            ? `${review.document.course.code} — ${review.document.course.title} · ${review.document.wordCount.toLocaleString()} words`
            : `${review.document.wordCount.toLocaleString()} words · not course-specific`
        }
        action={
          <ButtonLink href="/student/peer-review" variant="secondary">
            <ArrowLeft className="size-4" />
            Back to peer review
          </ButtonLink>
        }
      />

      {review.document.description ? (
        <Card className="mb-5">
          <CardHeader title="What the author asked for" />
          <p className="text-sm whitespace-pre-wrap">{review.document.description}</p>
        </Card>
      ) : null}

      {done ? (
        <Alert tone="success" title="You have already reviewed this document">
          Submitted {review.submittedAt ? formatDateTime(review.submittedAt) : ""}. The
          author has your feedback, and it stays anonymous.
        </Alert>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:items-start">
        {/* Left — the document */}
        <DocumentViewer
          title="The document"
          text={review.document.extractedText}
          wordCount={review.document.wordCount}
        />

        {/* Right — the review */}
        <div>
          {done ? (
            <Card>
              <CardHeader
                title="Your review"
                description="This is what you sent the author."
                icon={<CheckCircle2 className="size-4" />}
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
                        Quality {Math.round(review.qualityScore)}
                      </Badge>
                    ) : null}
                  </div>
                }
              />

              <ul className="mb-4 space-y-2">
                {REVIEW_CRITERIA.map((criterion) => (
                  <li
                    key={criterion.key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-sm">{criterion.label}</span>
                    <span className="flex gap-0.5" aria-label={`${ratings[criterion.key] ?? 0} out of ${MAX_RATING}`}>
                      {Array.from({ length: MAX_RATING }, (_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-3.5",
                            i < (ratings[criterion.key] ?? 0)
                              ? "fill-risk-moderate text-risk-moderate"
                              : "text-border-strong",
                          )}
                        />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                {[
                  { label: "What is working", value: review.strengths },
                  { label: "What to change", value: review.improvements },
                  { label: "Other comments", value: review.comment },
                ]
                  .filter((entry) => entry.value)
                  .map((entry) => (
                    <div key={entry.label} className="rounded-xl border border-border p-3.5">
                      <p className="mb-1.5 text-xs font-semibold text-muted uppercase">
                        {entry.label}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{entry.value}</p>
                    </div>
                  ))}
              </div>
            </Card>
          ) : review.document.extractedText.trim().length === 0 ? (
            <Card>
              <Alert tone="warning" title="This document has no readable text">
                Lume AI could not extract text from the file, so there is nothing to
                review. The author has been told; you can return to your list.
              </Alert>
            </Card>
          ) : (
            <DocumentReviewForm reviewId={review.id} />
          )}
        </div>
      </div>
    </>
  );
}
