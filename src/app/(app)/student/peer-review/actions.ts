"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { putFile, deleteFile } from "@/lib/storage";
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_LABEL,
  MAX_FILE_BYTES,
  detectType,
} from "@/lib/documents";
import {
  MAX_RATING,
  REVIEW_CRITERIA,
  allocateDocumentReviewers,
  claimDocumentReview,
  processReviewDocument,
  saveDocumentReview,
  type CriterionKey,
  type Ratings,
} from "@/lib/review-exchange";

export type ReviewActionState = { error?: string; success?: string } | null;

const MIN_REVIEWS = 1;
const MAX_REVIEWS = 5;

/**
 * Uploads a document and puts it up for peer review.
 *
 * Text extraction and reviewer allocation run in `after()` so the request
 * returns straight away; the document page reports the real status as it moves.
 */
export async function submitForPeerReview(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const user = await requireRole("STUDENT");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const reviewsRequested = Math.min(
    MAX_REVIEWS,
    Math.max(MIN_REVIEWS, Number(formData.get("reviewsRequested") ?? 2) || 2),
  );
  const file = formData.get("file");

  if (!title) return { error: "Give your document a title so reviewers know what they are reading." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a document to upload." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      error: `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is ${MAX_FILE_BYTES / 1024 / 1024}MB.`,
    };
  }

  const fileType = detectType(file.name);
  if (!fileType) {
    return {
      error: `Lume AI cannot read that file type. Upload ${ACCEPTED_LABEL} (${ACCEPTED_EXTENSIONS.join(", ")}).`,
    };
  }

  // A course can only be attached if the student is actually enrolled on it.
  let validCourseId: string | null = null;
  if (courseId) {
    const enrolment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: user.id, courseId } },
      select: { id: true },
    });
    validCourseId = enrolment ? courseId : null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await putFile(buffer, file.name);

  const document = await db.reviewDocument.create({
    data: {
      ownerId: user.id,
      title: title.slice(0, 160),
      description: description.slice(0, 2000) || null,
      courseId: validCourseId,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      storageKey,
      reviewsRequested,
      status: "PENDING",
    },
    select: { id: true },
  });

  await audit({
    userId: user.id,
    action: "PEER_REVIEW_SUBMIT",
    entity: "ReviewDocument",
    entityId: document.id,
    detail: `${file.name} · ${reviewsRequested} review(s) requested`,
  });

  after(() => processReviewDocument(document.id));

  revalidatePath("/student/peer-review");
  redirect(`/student/peer-review/${document.id}`);
}

/**
 * Puts a document the student already has on the platform up for peer review,
 * reusing the stored file rather than asking them to upload it a second time.
 */
export async function submitExistingForReview(
  kind: "submission" | "analysis",
  id: string,
): Promise<void> {
  const user = await requireRole("STUDENT");

  let source:
    | { title: string; fileName: string; fileType: string; fileSize: number; storageKey: string; courseId: string | null }
    | null = null;

  if (kind === "submission") {
    const submission = await db.submission.findUnique({
      where: { id },
      select: {
        studentId: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        storageKey: true,
        assignment: { select: { title: true, courseId: true } },
      },
    });
    if (submission && submission.studentId === user.id) {
      source = {
        title: submission.assignment.title,
        fileName: submission.fileName,
        fileType: submission.fileType,
        fileSize: submission.fileSize,
        storageKey: submission.storageKey,
        courseId: submission.assignment.courseId,
      };
    }
  } else {
    const analysis = await db.analysis.findUnique({
      where: { id },
      select: {
        userId: true,
        title: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        storageKey: true,
      },
    });
    if (
      analysis &&
      analysis.userId === user.id &&
      analysis.storageKey &&
      analysis.fileName &&
      analysis.fileType
    ) {
      source = {
        title: analysis.title,
        fileName: analysis.fileName,
        fileType: analysis.fileType,
        fileSize: analysis.fileSize,
        storageKey: analysis.storageKey,
        courseId: null,
      };
    }
  }

  if (!source) throw new Error("Document not found.");

  const document = await db.reviewDocument.create({
    data: {
      ownerId: user.id,
      title: source.title.slice(0, 160),
      courseId: source.courseId,
      fileName: source.fileName,
      fileType: source.fileType,
      fileSize: source.fileSize,
      // The same stored object backs both records. Deleting the review copy
      // must therefore not unlink the file, which is why deleteReviewDocument
      // only removes the row when no other record points at the key.
      storageKey: source.storageKey,
      reviewsRequested: 2,
      status: "PENDING",
    },
    select: { id: true },
  });

  await audit({
    userId: user.id,
    action: "PEER_REVIEW_SUBMIT",
    entity: "ReviewDocument",
    entityId: document.id,
    detail: `from existing ${kind}`,
  });

  after(() => processReviewDocument(document.id));
  redirect(`/student/peer-review/${document.id}`);
}

/** Author asks for reviewers again — useful when nobody was available before. */
export async function requestMoreReviewers(documentId: string): Promise<void> {
  const user = await requireRole("STUDENT");

  const document = await db.reviewDocument.findUnique({
    where: { id: documentId },
    select: { id: true, ownerId: true, status: true },
  });
  if (!document || document.ownerId !== user.id) throw new Error("Document not found.");

  if (document.status === "FAILED" || document.status === "PENDING") {
    after(() => processReviewDocument(documentId));
  } else {
    await allocateDocumentReviewers(documentId);
  }

  revalidatePath(`/student/peer-review/${documentId}`);
}

export async function deleteReviewDocument(documentId: string): Promise<void> {
  const user = await requireRole("STUDENT");

  const document = await db.reviewDocument.findUnique({
    where: { id: documentId },
    select: { id: true, ownerId: true, storageKey: true },
  });
  if (!document || document.ownerId !== user.id) throw new Error("Document not found.");

  // The file may be shared with a submission or an analysis if this document
  // was created from one, so only unlink it when nothing else points at it.
  const [otherDocuments, submissions, analyses] = await Promise.all([
    db.reviewDocument.count({
      where: { storageKey: document.storageKey, id: { not: documentId } },
    }),
    db.submission.count({ where: { storageKey: document.storageKey } }),
    db.analysis.count({ where: { storageKey: document.storageKey } }),
  ]);

  await db.reviewDocument.delete({ where: { id: documentId } });

  if (otherDocuments + submissions + analyses === 0) {
    await deleteFile(document.storageKey);
  }

  await audit({
    userId: user.id,
    action: "PEER_REVIEW_DELETE",
    entity: "ReviewDocument",
    entityId: documentId,
  });

  revalidatePath("/student/peer-review");
  redirect("/student/peer-review");
}

/** Picks up an unassigned document from the open pool. */
export async function claimReview(documentId: string): Promise<void> {
  const user = await requireRole("STUDENT");

  const reviewId = await claimDocumentReview(documentId, user.id);
  if (!reviewId) {
    // Someone else took the last slot between the page rendering and the click.
    revalidatePath("/student/peer-review");
    return;
  }

  await audit({
    userId: user.id,
    action: "PEER_REVIEW_CLAIM",
    entity: "DocumentReview",
    entityId: reviewId,
  });

  redirect(`/student/peer-review/review/${reviewId}`);
}

/** Saves a completed review. */
export async function submitDocumentReview(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const user = await requireRole("STUDENT");
  const reviewId = String(formData.get("reviewId") ?? "");

  const ratings: Ratings = {};
  for (const criterion of REVIEW_CRITERIA) {
    const raw = Number(formData.get(`rating_${criterion.key}`));
    if (Number.isFinite(raw) && raw >= 1 && raw <= MAX_RATING) {
      ratings[criterion.key as CriterionKey] = raw;
    }
  }

  if (Object.keys(ratings).length < REVIEW_CRITERIA.length) {
    return { error: "Rate every criterion before submitting — a partial review is not much use to the author." };
  }

  const strengths = String(formData.get("strengths") ?? "").trim();
  const improvements = String(formData.get("improvements") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();

  if (strengths.length < 20) {
    return { error: "Say what is working in at least a sentence or two. “Good essay” does not help anyone." };
  }
  if (improvements.length < 20) {
    return { error: "Give at least one concrete suggestion for improvement, in a sentence or two." };
  }

  try {
    await saveDocumentReview(reviewId, user.id, {
      ratings,
      strengths,
      improvements,
      comment,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "The review could not be saved.",
    };
  }

  await audit({
    userId: user.id,
    action: "PEER_REVIEW_COMPLETE",
    entity: "DocumentReview",
    entityId: reviewId,
  });

  revalidatePath("/student/peer-review");
  redirect("/student/peer-review?submitted=1");
}
