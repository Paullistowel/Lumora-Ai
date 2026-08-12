import { db } from "./db";
import { notifyMany } from "./notify";

/**
 * Module 7 — anonymous peer review allocation.
 *
 * Uses a rotating offset over a shuffled ring of submissions. That guarantees
 * every submission receives exactly `reviewersPerStudent` reviews and every
 * student writes the same number — which a naive random draw does not.
 */
export async function allocateReviews(assignmentId: string): Promise<number> {
  const assignment = await db.assignment.findUniqueOrThrow({
    where: { id: assignmentId },
    select: {
      id: true,
      title: true,
      peerReviewEnabled: true,
      reviewersPerStudent: true,
      reviewDueAt: true,
    },
  });

  if (!assignment.peerReviewEnabled) return 0;

  const submissions = await db.submission.findMany({
    where: { assignmentId, isLatest: true },
    select: { id: true, studentId: true },
  });

  // With n submissions each student can review at most n-1 peers.
  const perStudent = Math.min(
    assignment.reviewersPerStudent,
    Math.max(0, submissions.length - 1),
  );
  if (perStudent === 0) return 0;

  const ring = shuffle(submissions);
  const pairs: { submissionId: string; reviewerId: string }[] = [];

  for (let offset = 1; offset <= perStudent; offset++) {
    for (let i = 0; i < ring.length; i++) {
      const reviewer = ring[i];
      const target = ring[(i + offset) % ring.length];
      if (reviewer.studentId === target.studentId) continue;
      pairs.push({ submissionId: target.id, reviewerId: reviewer.studentId });
    }
  }

  const existing = await db.peerReview.findMany({
    where: { submission: { assignmentId } },
    select: { submissionId: true, reviewerId: true },
  });
  const seen = new Set(existing.map((r) => `${r.submissionId}:${r.reviewerId}`));

  const fresh = pairs.filter((p) => !seen.has(`${p.submissionId}:${p.reviewerId}`));
  if (fresh.length === 0) return 0;

  await db.peerReview.createMany({
    data: fresh.map((pair) => ({
      submissionId: pair.submissionId,
      reviewerId: pair.reviewerId,
      dueAt: assignment.reviewDueAt,
    })),
  });

  const reviewers = [...new Set(fresh.map((p) => p.reviewerId))];
  await notifyMany(
    reviewers.map((userId) => ({
      userId,
      type: "REVIEW" as const,
      title: "Peer reviews assigned",
      body: `You have been assigned anonymous reviews for "${assignment.title}".`,
      link: "/student/reviews",
    })),
  );

  return fresh.length;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
