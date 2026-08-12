import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { ReviewForm } from "./review-form";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("STUDENT");

  const review = await db.peerReview.findUnique({
    where: { id },
    select: {
      id: true,
      reviewerId: true,
      status: true,
      comment: true,
      qualityScore: true,
      qualityNotes: true,
      submittedAt: true,
      scores: {
        select: {
          score: true,
          comment: true,
          criterion: { select: { id: true, label: true, maxScore: true } },
        },
      },
      submission: {
        select: {
          // Deliberately no student identity — this is a blind review.
          extractedText: true,
          wordCount: true,
          assignment: {
            select: {
              title: true,
              instructions: true,
              course: { select: { code: true } },
              rubric: {
                select: {
                  name: true,
                  criteria: {
                    orderBy: { order: "asc" },
                    select: {
                      id: true,
                      label: true,
                      description: true,
                      maxScore: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!review || review.reviewerId !== user.id) notFound();

  const submitted = review.status === "SUBMITTED";
  const notes: string[] = review.qualityNotes ? JSON.parse(review.qualityNotes) : [];

  return (
    <>
      <PageHeader
        title={review.submission.assignment.title}
        description={`${review.submission.assignment.course.code} · anonymous peer review`}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader
            title="Submission"
            description={`${review.submission.wordCount} words · the author's identity is hidden`}
          />
          <div className="max-h-[32rem] overflow-y-auto rounded-lg border border-border bg-surface-muted p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {review.submission.extractedText || "No text could be extracted."}
          </div>
        </Card>

        <aside className="space-y-5">
          <Card>
            <CardHeader title="Assignment brief" />
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted">
              {review.submission.assignment.instructions}
            </p>
          </Card>

          {submitted ? (
            <Card>
              <CardHeader
                title="Your review"
                description={
                  review.submittedAt ? formatDateTime(review.submittedAt) : undefined
                }
                action={
                  review.qualityScore !== null ? (
                    <Badge
                      tone={
                        review.qualityScore >= 70
                          ? "success"
                          : review.qualityScore >= 40
                            ? "warning"
                            : "danger"
                      }
                    >
                      Quality {review.qualityScore}/100
                    </Badge>
                  ) : undefined
                }
              />
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {review.comment}
              </p>

              {review.scores.length > 0 ? (
                <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                  {review.scores.map((score, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>{score.criterion.label}</span>
                      <span className="tabular-nums text-muted">
                        {score.score}/{score.criterion.maxScore}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {notes.length > 0 ? (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-1.5 text-xs font-medium tracking-wide text-muted uppercase">
                    How your review was assessed
                  </p>
                  <ul className="space-y-1 text-sm text-muted">
                    {notes.map((note, i) => (
                      <li key={i}>• {note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>
          ) : (
            <Card>
              <CardHeader
                title="Write your review"
                description="Specific, constructive feedback scores highest."
              />
              <ReviewForm
                reviewId={review.id}
                criteria={review.submission.assignment.rubric?.criteria ?? []}
              />
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
