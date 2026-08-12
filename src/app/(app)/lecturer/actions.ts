"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify, notifyMany } from "@/lib/notify";
import { allocateReviews } from "@/lib/peer-review";

export type ActionState = { error?: string; success?: string } | null;

/** Confirms the signed-in lecturer actually owns the course. */
async function assertOwnsCourse(lecturerId: string, courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { lecturerId: true },
  });
  return course?.lecturerId === lecturerId;
}

const assignmentSchema = z.object({
  courseId: z.string().min(1, "Choose a course."),
  title: z.string().trim().min(3, "Give the assignment a title."),
  instructions: z.string().trim().min(10, "Write instructions for your students."),
  dueAt: z.string().min(1, "Set a due date."),
  maxMarks: z.coerce.number().int().min(1).max(1000),
  similarityThreshold: z.coerce.number().int().min(1).max(100),
  allowLate: z.coerce.boolean().optional(),
  peerReviewEnabled: z.coerce.boolean().optional(),
  reviewersPerStudent: z.coerce.number().int().min(1).max(5).optional(),
  reviewDueAt: z.string().optional(),
  rubricId: z.string().optional(),
});

export async function createAssignment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("LECTURER");
  const raw = Object.fromEntries(formData);
  const parsed = assignmentSchema.safeParse({
    ...raw,
    allowLate: formData.get("allowLate") === "on",
    peerReviewEnabled: formData.get("peerReviewEnabled") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  if (!(await assertOwnsCourse(user.id, data.courseId))) {
    return { error: "You do not teach that course." };
  }

  const dueAt = new Date(data.dueAt);
  if (Number.isNaN(dueAt.getTime())) return { error: "The due date is invalid." };

  const assignment = await db.assignment.create({
    data: {
      courseId: data.courseId,
      createdById: user.id,
      title: data.title,
      instructions: data.instructions,
      dueAt,
      maxMarks: data.maxMarks,
      similarityThreshold: data.similarityThreshold,
      allowLate: data.allowLate ?? false,
      peerReviewEnabled: data.peerReviewEnabled ?? false,
      reviewersPerStudent: data.reviewersPerStudent ?? 2,
      reviewDueAt:
        data.reviewDueAt && data.reviewDueAt.length > 0
          ? new Date(data.reviewDueAt)
          : null,
      rubricId: data.rubricId && data.rubricId.length > 0 ? data.rubricId : null,
    },
    select: { id: true, title: true, courseId: true },
  });

  await audit({
    userId: user.id,
    action: "ASSIGNMENT_CREATED",
    entity: "Assignment",
    entityId: assignment.id,
    detail: assignment.title,
  });

  const students = await db.enrollment.findMany({
    where: { courseId: data.courseId },
    select: { studentId: true },
  });
  await notifyMany(
    students.map((s) => ({
      userId: s.studentId,
      type: "DEADLINE" as const,
      title: "New assignment published",
      body: `"${assignment.title}" is due ${dueAt.toDateString()}.`,
      link: `/student/assignments/${assignment.id}`,
    })),
  );

  revalidatePath("/lecturer/assignments");
  redirect(`/lecturer/assignments/${assignment.id}`);
}

export async function toggleAssignmentLock(formData: FormData): Promise<void> {
  const user = await requireRole("LECTURER");
  const assignmentId = String(formData.get("assignmentId") ?? "");

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    select: { locked: true, courseId: true },
  });
  if (!assignment || !(await assertOwnsCourse(user.id, assignment.courseId))) return;

  await db.assignment.update({
    where: { id: assignmentId },
    data: { locked: !assignment.locked },
  });
  await audit({
    userId: user.id,
    action: assignment.locked ? "ASSIGNMENT_UNLOCKED" : "ASSIGNMENT_LOCKED",
    entity: "Assignment",
    entityId: assignmentId,
  });
  revalidatePath(`/lecturer/assignments/${assignmentId}`);
}

/** Module 7 — allocate anonymous reviewers once submissions are in. */
export async function allocatePeerReviews(formData: FormData): Promise<void> {
  const user = await requireRole("LECTURER");
  const assignmentId = String(formData.get("assignmentId") ?? "");

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    select: { courseId: true },
  });
  if (!assignment || !(await assertOwnsCourse(user.id, assignment.courseId))) return;

  const created = await allocateReviews(assignmentId);
  await audit({
    userId: user.id,
    action: "REVIEWS_ALLOCATED",
    entity: "Assignment",
    entityId: assignmentId,
    detail: `${created} allocations`,
  });
  revalidatePath(`/lecturer/assignments/${assignmentId}`);
}

export async function gradeSubmission(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("LECTURER");
  const submissionId = String(formData.get("submissionId") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();
  const grade = Number(formData.get("grade"));

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    select: {
      studentId: true,
      assignment: {
        select: { id: true, title: true, maxMarks: true, courseId: true },
      },
    },
  });
  if (!submission) return { error: "Submission not found." };
  if (!(await assertOwnsCourse(user.id, submission.assignment.courseId))) {
    return { error: "You do not teach that course." };
  }
  if (!Number.isFinite(grade) || grade < 0 || grade > submission.assignment.maxMarks) {
    return { error: `Enter a mark between 0 and ${submission.assignment.maxMarks}.` };
  }

  await db.submission.update({
    where: { id: submissionId },
    data: { grade, feedback: feedback || null, gradedAt: new Date() },
  });

  await audit({
    userId: user.id,
    action: "GRADE",
    entity: "Submission",
    entityId: submissionId,
    detail: `${grade}/${submission.assignment.maxMarks}`,
  });

  await notify({
    userId: submission.studentId,
    type: "FEEDBACK",
    title: "Your assignment has been graded",
    body: `${submission.assignment.title}: ${grade}/${submission.assignment.maxMarks}.`,
    link: `/student/submissions/${submissionId}`,
  });

  revalidatePath(`/lecturer/assignments/${submission.assignment.id}`);
  return { success: "Mark saved." };
}

const rubricSchema = z.object({
  name: z.string().trim().min(3, "Name the rubric."),
  description: z.string().trim().optional(),
  isTemplate: z.coerce.boolean().optional(),
});

export async function createRubric(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("LECTURER");
  const parsed = rubricSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    isTemplate: formData.get("isTemplate") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Criteria arrive as parallel arrays from the repeatable fieldset.
  const labels = formData.getAll("criterionLabel").map(String);
  const maxScores = formData.getAll("criterionMax").map(Number);
  const weights = formData.getAll("criterionWeight").map(Number);
  const descriptions = formData.getAll("criterionDescription").map(String);

  const criteria = labels
    .map((label, i) => ({
      label: label.trim(),
      description: descriptions[i]?.trim() || null,
      maxScore: Number.isFinite(maxScores[i]) ? maxScores[i] : 10,
      weight: Number.isFinite(weights[i]) ? weights[i] : 1,
      order: i,
    }))
    .filter((criterion) => criterion.label.length > 0);

  if (criteria.length === 0) return { error: "Add at least one criterion." };

  const rubric = await db.rubric.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      isTemplate: parsed.data.isTemplate ?? false,
      criteria: { create: criteria },
    },
    select: { id: true },
  });

  await audit({
    userId: user.id,
    action: "RUBRIC_CREATED",
    entity: "Rubric",
    entityId: rubric.id,
    detail: parsed.data.name,
  });

  revalidatePath("/lecturer/rubrics");
  return { success: "Rubric created." };
}
