import { db } from "./db";
import { getFile } from "./storage";
import {
  cleanText,
  countWords,
  detectParagraphs,
  extractText,
  type SupportedType,
} from "./documents";
import { embed, serializeVector } from "./embeddings";
import { computeSimilarity, saveSimilarityResult } from "./similarity";
import { analyzeWriting } from "./writing";
import { notify } from "./notify";

/**
 * Orchestrates Modules 4 → 6 for one submission:
 * extract → clean → paragraphs → embeddings → similarity → writing feedback.
 *
 * Runs inline after upload. Under real load this is the unit of work you hand
 * to a queue; the function is already idempotent so a retry is safe.
 */
export async function processSubmission(submissionId: string): Promise<void> {
  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      studentId: true,
      storageKey: true,
      fileType: true,
      extractedText: true,
      assignment: { select: { id: true, title: true } },
    },
  });
  if (!submission) return;

  await db.submission.update({
    where: { id: submissionId },
    data: { status: "PROCESSING", statusDetail: null },
  });

  try {
    // 1 — Extract. Seeded records carry their text directly and have no file.
    let raw: string;
    try {
      const buffer = await getFile(submission.storageKey);
      raw = await extractText(buffer, submission.fileType as SupportedType);
    } catch (error) {
      if (!submission.extractedText) throw error;
      raw = submission.extractedText;
    }

    const text = cleanText(raw);

    if (countWords(text) < 30) {
      await db.submission.update({
        where: { id: submissionId },
        data: {
          status: "FAILED",
          statusDetail:
            "Could not extract readable text. If this is a scanned PDF, submit a text-based version.",
          extractedText: text,
          wordCount: countWords(text),
        },
      });
      return;
    }

    // 2 — Paragraph detection.
    const paragraphs = detectParagraphs(text);

    // 3 — Embeddings. Re-running replaces prior chunks so rechecks stay clean.
    const vectors = await embed(paragraphs.map((p) => p.text));

    await db.chunk.deleteMany({ where: { submissionId } });
    if (paragraphs.length > 0) {
      await db.chunk.createMany({
        data: paragraphs.map((paragraph, i) => ({
          submissionId,
          index: paragraph.index,
          text: paragraph.text,
          charStart: paragraph.charStart,
          charEnd: paragraph.charEnd,
          embedding: serializeVector(vectors[i]),
        })),
      });
    }

    await db.submission.update({
      where: { id: submissionId },
      data: { extractedText: text, wordCount: countWords(text) },
    });

    // 4 — Similarity search against the assignment corpus.
    const computation = await computeSimilarity(submissionId);
    await saveSimilarityResult(submissionId, computation);

    // 5 — Writing feedback.
    const analysis = analyzeWriting(text);
    await db.writingFeedback.deleteMany({ where: { submissionId } });
    await db.writingFeedback.create({
      data: {
        submissionId,
        readabilityScore: analysis.readabilityScore,
        gradeLevel: analysis.gradeLevel,
        academicToneScore: analysis.academicToneScore,
        overallScore: analysis.overallScore,
        issues: JSON.stringify(analysis.issues),
        strengths: JSON.stringify(analysis.strengths),
      },
    });

    await db.submission.update({
      where: { id: submissionId },
      data: { status: "COMPLETE", statusDetail: null },
    });

    await notify({
      userId: submission.studentId,
      type: "SIMILARITY",
      title: "Your originality report is ready",
      body: `${submission.assignment.title}: ${computation.overallScore}% similarity (${computation.riskLevel.toLowerCase()}).`,
      link: `/student/submissions/${submissionId}`,
    });
  } catch (error) {
    console.error("[pipeline] processing failed", submissionId, error);
    await db.submission.update({
      where: { id: submissionId },
      data: {
        status: "FAILED",
        statusDetail:
          error instanceof Error ? error.message : "Processing failed unexpectedly.",
      },
    });
  }
}

/**
 * When a new submission enters the corpus, everyone it matched against has a
 * stale report. Recomputing scores (not re-embedding) keeps them honest.
 */
export async function refreshPeerScores(
  assignmentId: string,
  excludeSubmissionId: string,
) {
  const peers = await db.submission.findMany({
    where: {
      assignmentId,
      isLatest: true,
      status: "COMPLETE",
      id: { not: excludeSubmissionId },
    },
    select: { id: true },
  });

  for (const peer of peers) {
    try {
      const computation = await computeSimilarity(peer.id);
      await saveSimilarityResult(peer.id, computation);
    } catch (error) {
      console.error("[pipeline] peer refresh failed", peer.id, error);
    }
  }
}
