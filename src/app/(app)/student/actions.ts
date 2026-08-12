"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { putFile } from "@/lib/storage";
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_LABEL,
  MAX_FILE_BYTES,
  detectType,
} from "@/lib/documents";
import { processSubmission, refreshPeerScores } from "@/lib/pipeline";
import { assessReviewQuality } from "@/lib/review-quality";

export type ActionState = { error?: string; success?: string } | null;

/** Module 3 + 4 + 5 — upload, then run the full processing pipeline. */
export async function submitAssignment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("STUDENT");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to submit." };
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

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      title: true,
      dueAt: true,
      locked: true,
      allowLate: true,
      courseId: true,
      course: { select: { lecturerId: true } },
    },
  });
  if (!assignment) return { error: "Assignment not found." };

  const enrolled = await db.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: user.id, courseId: assignment.courseId },
    },
    select: { id: true },
  });
  if (!enrolled) return { error: "You are not enrolled in this course." };

  if (assignment.locked) {
    return { error: "This assignment is locked and no longer accepts submissions." };
  }

  const isLate = new Date() > assignment.dueAt;
  if (isLate && !assignment.allowLate) {
    return { error: "The deadline has passed and late submissions are not allowed." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await putFile(buffer, file.name);

  // Version control: the previous attempt is retained but leaves the corpus.
  const previous = await db.submission.findFirst({
    where: { assignmentId, studentId: user.id },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const submission = await db.$transaction(async (tx) => {
    await tx.submission.updateMany({
      where: { assignmentId, studentId: user.id },
      data: { isLatest: false },
    });
    return tx.submission.create({
      data: {
        assignmentId,
        studentId: user.id,
        version: (previous?.version ?? 0) + 1,
        isLatest: true,
        isLate,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        storageKey,
        status: "PENDING",
      },
    });
  });

  await audit({
    userId: user.id,
    action: "SUBMIT",
    entity: "Submission",
    entityId: submission.id,
    detail: `${assignment.title} v${submission.version}${isLate ? " (late)" : ""}`,
  });

  // Processing runs after the response. Embedding a document — and, on a cold
  // server, loading the model first — takes long enough that blocking the
  // submit button on it reads as a hung page. The submission page reports the
  // real status instead.
  after(async () => {
    await processSubmission(submission.id);
    // A new document changes everyone else's similarity picture.
    await refreshPeerScores(assignmentId, submission.id);
  });

  if (assignment.course.lecturerId) {
    await notify({
      userId: assignment.course.lecturerId,
      type: "SUBMISSION",
      title: "New submission",
      body: `${user.fullName} submitted "${assignment.title}"${isLate ? " (late)" : ""}.`,
      link: `/lecturer/assignments/${assignmentId}`,
    });
  }

  revalidatePath("/student");
  revalidatePath("/student/submissions");
  redirect(`/student/submissions/${submission.id}`);
}

/** Re-runs the pipeline — used after the corpus grows or a check fails. */
export async function recheckSubmission(formData: FormData): Promise<void> {
  const user = await requireRole("STUDENT");
  const submissionId = String(formData.get("submissionId") ?? "");

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, studentId: true },
  });
  if (!submission || submission.studentId !== user.id) return;

  await audit({
    userId: user.id,
    action: "RECHECK",
    entity: "Submission",
    entityId: submissionId,
  });

  await db.submission.update({
    where: { id: submissionId },
    data: { status: "PENDING", statusDetail: null },
  });

  after(() => processSubmission(submissionId));
  revalidatePath(`/student/submissions/${submissionId}`);
}

export async function enrol(formData: FormData): Promise<void> {
  const user = await requireRole("STUDENT");
  const courseId = String(formData.get("courseId") ?? "");

  await db.enrollment
    .create({ data: { studentId: user.id, courseId } })
    .catch(() => undefined); // already enrolled

  await audit({
    userId: user.id,
    action: "ENROL",
    entity: "Course",
    entityId: courseId,
  });
  revalidatePath("/student/courses");
  revalidatePath("/student/assignments");
}

export async function unenrol(formData: FormData): Promise<void> {
  const user = await requireRole("STUDENT");
  const courseId = String(formData.get("courseId") ?? "");

  // Withdrawing must not orphan submitted work.
  const submissions = await db.submission.count({
    where: { studentId: user.id, assignment: { courseId } },
  });
  if (submissions > 0) return;

  await db.enrollment.deleteMany({ where: { studentId: user.id, courseId } });
  revalidatePath("/student/courses");
}

/** Module 7 + 9 — save a peer review and score its quality. */
export async function submitPeerReview(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("STUDENT");
  const reviewId = String(formData.get("reviewId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  const review = await db.peerReview.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      reviewerId: true,
      status: true,
      submission: {
        select: {
          id: true,
          studentId: true,
          assignment: {
            select: {
              title: true,
              rubric: { select: { criteria: { select: { id: true, maxScore: true } } } },
            },
          },
        },
      },
    },
  });

  if (!review || review.reviewerId !== user.id) {
    return { error: "Review not found." };
  }
  if (review.status === "SUBMITTED") {
    return { error: "You have already submitted this review." };
  }
  if (comment.length < 20) {
    return { error: "Write at least a couple of sentences of feedback." };
  }

  const criteria = review.submission.assignment.rubric?.criteria ?? [];
  const criterionComments: string[] = [];
  const scores: { criterionId: string; score: number; comment: string | null }[] = [];

  for (const criterion of criteria) {
    const raw = Number(formData.get(`score_${criterion.id}`));
    if (!Number.isFinite(raw) || raw < 0 || raw > criterion.maxScore) {
      return { error: "Give every rubric criterion a score within its range." };
    }
    const note = String(formData.get(`comment_${criterion.id}`) ?? "").trim();
    if (note) criterionComments.push(note);
    scores.push({ criterionId: criterion.id, score: raw, comment: note || null });
  }

  const totalScore = criteria.length
    ? scores.reduce((sum, s) => sum + s.score, 0)
    : null;

  const quality = assessReviewQuality(comment, criterionComments);

  await db.$transaction(async (tx) => {
    await tx.reviewScore.deleteMany({ where: { reviewId } });
    if (scores.length > 0) {
      await tx.reviewScore.createMany({
        data: scores.map((s) => ({ reviewId, ...s })),
      });
    }
    await tx.peerReview.update({
      where: { id: reviewId },
      data: {
        comment,
        totalScore,
        status: "SUBMITTED",
        submittedAt: new Date(),
        qualityScore: quality.score,
        qualityBreakdown: JSON.stringify(quality.breakdown),
        qualityNotes: JSON.stringify(quality.notes),
      },
    });
  });

  await audit({
    userId: user.id,
    action: "REVIEW_SUBMITTED",
    entity: "PeerReview",
    entityId: reviewId,
    detail: `quality ${quality.score}/100`,
  });

  await notify({
    userId: review.submission.studentId,
    type: "REVIEW",
    title: "You received peer feedback",
    body: `An anonymous reviewer commented on "${review.submission.assignment.title}".`,
    link: `/student/submissions/${review.submission.id}`,
  });

  revalidatePath("/student/reviews");
  redirect("/student/reviews");
}
