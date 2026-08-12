import { db } from "./db";
import { deserializeVector } from "./embeddings";
import { riskLevelFor, type RiskLevel } from "./risk";

export { riskLevelFor, RISK_BANDS, type RiskLevel } from "./risk";

/**
 * Module 5 — AI Plagiarism Detection Engine.
 *
 * Compares a submission's paragraph embeddings against every other student's
 * chunks for the same assignment, then rolls per-paragraph maxima up into a
 * document-level score.
 */

/** A paragraph counts as matched at or above this cosine similarity. */
const MATCH_THRESHOLD = 0.75;
/** Matches kept per paragraph for the report. */
const TOP_K = 10;

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export type ParagraphFinding = {
  chunkId: string;
  index: number;
  text: string;
  bestScore: number;
  matches: {
    targetChunkId: string;
    score: number;
    studentName: string;
    submissionId: string;
  }[];
};

export type SimilarityComputation = {
  overallScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  chunksAnalyzed: number;
  chunksFlagged: number;
  comparedAgainst: number;
  findings: ParagraphFinding[];
};

/**
 * The corpus is scoped to the assignment: cross-assignment matches would flag
 * shared prompts and reused course terminology as plagiarism. Every prior
 * version of the author's own work is excluded too.
 */
export async function computeSimilarity(
  submissionId: string,
): Promise<SimilarityComputation> {
  const submission = await db.submission.findUniqueOrThrow({
    where: { id: submissionId },
    select: {
      id: true,
      studentId: true,
      assignmentId: true,
      chunks: {
        orderBy: { index: "asc" },
        select: { id: true, index: true, text: true, embedding: true },
      },
    },
  });

  const corpus = await db.chunk.findMany({
    where: {
      submission: {
        assignmentId: submission.assignmentId,
        studentId: { not: submission.studentId },
        isLatest: true,
      },
    },
    select: {
      id: true,
      text: true,
      embedding: true,
      submissionId: true,
      submission: {
        select: { id: true, student: { select: { fullName: true } } },
      },
    },
  });

  const analyzed = submission.chunks.length;

  if (analyzed === 0 || corpus.length === 0) {
    return {
      overallScore: 0,
      riskLevel: "ORIGINAL",
      // With nothing to compare against, a 0% score is not evidence of
      // originality — surface that as zero confidence rather than a clean bill.
      confidence: corpus.length === 0 ? 0 : confidenceFor(analyzed),
      chunksAnalyzed: analyzed,
      chunksFlagged: 0,
      comparedAgainst: new Set(corpus.map((c) => c.submissionId)).size,
      findings: [],
    };
  }

  const corpusVectors = corpus.map((chunk) => ({
    ...chunk,
    vector: deserializeVector(chunk.embedding),
  }));

  const findings: ParagraphFinding[] = [];
  let weightedMatch = 0;
  let totalWeight = 0;
  let flagged = 0;

  for (const chunk of submission.chunks) {
    const vector = deserializeVector(chunk.embedding);

    const scored = corpusVectors
      .map((candidate) => ({
        targetChunkId: candidate.id,
        submissionId: candidate.submissionId,
        studentName: candidate.submission.student.fullName,
        score: cosine(vector, candidate.vector),
      }))
      .filter((m) => m.score >= MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);

    const bestScore = scored[0]?.score ?? 0;
    if (bestScore >= MATCH_THRESHOLD) flagged++;

    // Longer paragraphs carry more weight: a matched 300-word body paragraph is
    // stronger evidence than a matched one-line heading.
    const weight = Math.max(chunk.text.length, 1);
    weightedMatch += bestScore >= MATCH_THRESHOLD ? bestScore * weight : 0;
    totalWeight += weight;

    findings.push({
      chunkId: chunk.id,
      index: chunk.index,
      text: chunk.text,
      bestScore,
      matches: scored,
    });
  }

  const overallScore = Math.round((weightedMatch / totalWeight) * 1000) / 10;

  return {
    overallScore,
    riskLevel: riskLevelFor(overallScore),
    confidence: confidenceFor(analyzed),
    chunksAnalyzed: analyzed,
    chunksFlagged: flagged,
    comparedAgainst: new Set(corpus.map((c) => c.submissionId)).size,
    findings,
  };
}

/** Short documents give the model little to work with; say so explicitly. */
function confidenceFor(chunkCount: number): number {
  if (chunkCount === 0) return 0;
  return Math.min(1, 0.4 + chunkCount * 0.08);
}

/** Persists a computation, replacing any previous result for the submission. */
export async function saveSimilarityResult(
  submissionId: string,
  computation: SimilarityComputation,
) {
  await db.similarityResult.deleteMany({ where: { submissionId } });

  const result = await db.similarityResult.create({
    data: {
      submissionId,
      overallScore: computation.overallScore,
      riskLevel: computation.riskLevel,
      confidence: computation.confidence,
      chunksAnalyzed: computation.chunksAnalyzed,
      chunksFlagged: computation.chunksFlagged,
      comparedAgainst: computation.comparedAgainst,
    },
  });

  const matches = computation.findings.flatMap((finding) =>
    finding.matches.map((match) => ({
      resultId: result.id,
      sourceChunkId: finding.chunkId,
      targetChunkId: match.targetChunkId,
      score: match.score,
    })),
  );

  if (matches.length > 0) {
    await db.similarityMatch.createMany({ data: matches });
  }

  return result;
}
