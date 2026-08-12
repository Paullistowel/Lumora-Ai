import "server-only";

import { db } from "./db";
import { getFile } from "./storage";
import { cleanText, countWords, extractText, type SupportedType } from "./documents";
import { notify, notifyMany } from "./notify";
import { assessReviewQuality } from "./review-quality";

/**
 * Peer review exchange.
 *
 * Student-initiated review: someone uploads a draft, asks for feedback, and
 * other students review it. Deliberately separate from the assignment peer
 * review in lib/peer-review.ts, which is lecturer-driven, rubric-scored and
 * tied to a submission.
 *
 * The allocation rule is reciprocity-first: reviewers are drawn from students
 * who have put a document up themselves, least-loaded first, so the people
 * asking for feedback are the people giving it. Anything still unassigned
 * stays claimable from an open pool, which keeps the workflow unblocked when
 * nobody else has uploaded yet.
 */

// ── Review criteria ─────────────────────────────────────────────────────────

export const REVIEW_CRITERIA = [
  {
    key: "content",
    label: "Content",
    hint: "Is the argument substantive, accurate and well supported?",
  },
  {
    key: "organization",
    label: "Organization",
    hint: "Does it move logically from introduction through body to conclusion?",
  },
  {
    key: "clarity",
    label: "Clarity",
    hint: "Can you follow it on one reading, without re-reading sentences?",
  },
  {
    key: "grammar",
    label: "Grammar & style",
    hint: "Is the writing correct and appropriately academic in register?",
  },
  {
    key: "research",
    label: "Research & references",
    hint: "Are claims attributed, and are the sources doing real work?",
  },
  {
    key: "originality",
    label: "Originality",
    hint: "Does it contribute a view of its own rather than summarising others?",
  },
] as const;

export type CriterionKey = (typeof REVIEW_CRITERIA)[number]["key"];

export const MAX_RATING = 5;

export type Ratings = Partial<Record<CriterionKey, number>>;

export function parseRatings(value: string): Ratings {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const ratings: Ratings = {};
    for (const criterion of REVIEW_CRITERIA) {
      const score = parsed[criterion.key];
      if (typeof score === "number" && score >= 1 && score <= MAX_RATING) {
        ratings[criterion.key] = score;
      }
    }
    return ratings;
  } catch {
    return {};
  }
}

export function averageRating(ratings: Ratings): number | null {
  const values = Object.values(ratings).filter(
    (value): value is number => typeof value === "number",
  );
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

// ── Statuses ────────────────────────────────────────────────────────────────

export const DOCUMENT_STATUS = {
  PENDING: { label: "Queued", tone: "neutral" as const },
  PROCESSING: { label: "Processing", tone: "brand" as const },
  OPEN: { label: "Waiting for reviewers", tone: "warning" as const },
  IN_REVIEW: { label: "In review", tone: "brand" as const },
  COMPLETE: { label: "Feedback received", tone: "success" as const },
  FAILED: { label: "Failed", tone: "danger" as const },
} as const;

export type DocumentStatus = keyof typeof DOCUMENT_STATUS;

// ── Processing ──────────────────────────────────────────────────────────────

/**
 * Extracts a newly uploaded review document, then opens it for review and
 * allocates reviewers. Safe to re-run.
 */
export async function processReviewDocument(documentId: string): Promise<void> {
  const document = await db.reviewDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      storageKey: true,
      fileType: true,
      reviewsRequested: true,
    },
  });
  if (!document) return;

  await db.reviewDocument.update({
    where: { id: documentId },
    data: { status: "PROCESSING", statusDetail: null },
  });

  try {
    const buffer = await getFile(document.storageKey);
    const raw = await extractText(buffer, document.fileType as SupportedType);
    const text = cleanText(raw);
    const words = countWords(text);

    if (words < 30) {
      await db.reviewDocument.update({
        where: { id: documentId },
        data: {
          status: "FAILED",
          extractedText: text,
          wordCount: words,
          statusDetail:
            "Almost no readable text could be extracted. If this is a scanned PDF, upload a text-based version instead — a reviewer would not be able to read it either.",
        },
      });
      return;
    }

    await db.reviewDocument.update({
      where: { id: documentId },
      data: {
        extractedText: text,
        wordCount: words,
        status: "OPEN",
        statusDetail: null,
      },
    });

    await allocateDocumentReviewers(documentId);
  } catch (error) {
    console.error("[review-exchange] processing failed", documentId, error);
    await db.reviewDocument.update({
      where: { id: documentId },
      data: {
        status: "FAILED",
        statusDetail:
          error instanceof Error
            ? error.message
            : "The document could not be read. Try uploading it again.",
      },
    });
  }
}

// ── Allocation ──────────────────────────────────────────────────────────────

/**
 * Assigns reviewers to a document, up to what the author asked for.
 *
 * Candidates are students other than the author, ranked by how much reviewing
 * they already owe — least-loaded first — with anyone who has uploaded a
 * document of their own preferred, so the exchange stays reciprocal.
 */
export async function allocateDocumentReviewers(
  documentId: string,
): Promise<number> {
  const document = await db.reviewDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      reviewsRequested: true,
      status: true,
      courseId: true,
      reviews: { select: { reviewerId: true } },
    },
  });
  if (!document || !["OPEN", "IN_REVIEW"].includes(document.status)) return 0;

  const alreadyAssigned = new Set(document.reviews.map((r) => r.reviewerId));
  const slots = document.reviewsRequested - alreadyAssigned.size;
  if (slots <= 0) return 0;

  // Prefer classmates when the document is attached to a course.
  const candidates = await db.user.findMany({
    where: {
      role: "STUDENT",
      suspended: false,
      id: { not: document.ownerId, notIn: [...alreadyAssigned] },
      ...(document.courseId
        ? { enrollments: { some: { courseId: document.courseId } } }
        : {}),
    },
    select: {
      id: true,
      _count: {
        select: {
          documentReviews: { where: { status: "ASSIGNED" } },
          reviewDocuments: true,
        },
      },
    },
  });

  const ranked = candidates
    .map((candidate) => ({
      id: candidate.id,
      outstanding: candidate._count.documentReviews,
      // Someone who has asked for feedback themselves goes first.
      reciprocal: candidate._count.reviewDocuments > 0 ? 0 : 1,
    }))
    .sort(
      (a, b) => a.reciprocal - b.reciprocal || a.outstanding - b.outstanding,
    )
    .slice(0, slots);

  if (ranked.length === 0) return 0;

  await db.documentReview.createMany({
    data: ranked.map((candidate) => ({
      documentId,
      reviewerId: candidate.id,
    })),
  });

  await db.reviewDocument.update({
    where: { id: documentId },
    data: { status: "IN_REVIEW" },
  });

  await notifyMany(
    ranked.map((candidate) => ({
      userId: candidate.id,
      type: "REVIEW" as const,
      title: "A peer review is waiting for you",
      body: `A classmate has asked for feedback on "${document.title}". The author is anonymous, and so are you.`,
      link: "/student/peer-review",
    })),
  );

  return ranked.length;
}

/**
 * Lets a student pick up an unassigned document from the open pool. Returns
 * the review id, or null if the document is no longer available to them.
 */
export async function claimDocumentReview(
  documentId: string,
  reviewerId: string,
): Promise<string | null> {
  const document = await db.reviewDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      status: true,
      reviewsRequested: true,
      _count: { select: { reviews: true } },
    },
  });

  if (!document) return null;
  if (document.ownerId === reviewerId) return null;
  if (!["OPEN", "IN_REVIEW"].includes(document.status)) return null;
  if (document._count.reviews >= document.reviewsRequested) return null;

  const existing = await db.documentReview.findUnique({
    where: { documentId_reviewerId: { documentId, reviewerId } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const review = await db.documentReview.create({
    data: { documentId, reviewerId },
    select: { id: true },
  });

  await db.reviewDocument.update({
    where: { id: documentId },
    data: { status: "IN_REVIEW" },
  });

  return review.id;
}

// ── Submitting a review ─────────────────────────────────────────────────────

export type ReviewInput = {
  ratings: Ratings;
  strengths: string;
  improvements: string;
  comment: string;
};

/** Records a completed review, scores its quality, and notifies the author. */
export async function saveDocumentReview(
  reviewId: string,
  reviewerId: string,
  input: ReviewInput,
): Promise<void> {
  const review = await db.documentReview.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      reviewerId: true,
      status: true,
      document: {
        select: {
          id: true,
          ownerId: true,
          title: true,
          reviewsRequested: true,
        },
      },
    },
  });

  if (!review || review.reviewerId !== reviewerId) {
    throw new Error("Review not found.");
  }
  if (review.status === "SUBMITTED") {
    throw new Error("You have already submitted this review.");
  }

  // The quality assessment reads the whole written response, since strengths
  // and improvements are where the substance usually is.
  const written = [input.strengths, input.improvements, input.comment]
    .filter(Boolean)
    .join("\n\n");
  const quality = assessReviewQuality(written);

  await db.documentReview.update({
    where: { id: reviewId },
    data: {
      status: "SUBMITTED",
      ratings: JSON.stringify(input.ratings),
      overall: averageRating(input.ratings),
      strengths: input.strengths,
      improvements: input.improvements,
      comment: input.comment,
      qualityScore: quality.score,
      qualityBreakdown: JSON.stringify(quality.breakdown),
      submittedAt: new Date(),
    },
  });

  // Once every requested review is in, the document is done.
  const submitted = await db.documentReview.count({
    where: { documentId: review.document.id, status: "SUBMITTED" },
  });
  if (submitted >= review.document.reviewsRequested) {
    await db.reviewDocument.update({
      where: { id: review.document.id },
      data: { status: "COMPLETE" },
    });
  }

  await notify({
    userId: review.document.ownerId,
    type: "REVIEW",
    title: "You have new peer feedback",
    body: `A reviewer has responded to "${review.document.title}". ${submitted} of ${review.document.reviewsRequested} reviews are in.`,
    link: `/student/peer-review/${review.document.id}`,
  });
}
