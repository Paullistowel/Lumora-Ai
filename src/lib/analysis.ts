import "server-only";

import { db } from "./db";
import { getFile } from "./storage";
import {
  cleanText,
  countWords,
  detectParagraphs,
  extractText,
  type SupportedType,
} from "./documents";
import { backendUsed, embed, EMBEDDING_MODEL_ID } from "./embeddings";
import { cosine } from "./similarity";
import { riskLevelFor, type RiskLevel } from "./risk";
import { analyzeWriting, type WritingAnalysis } from "./writing";
import { detectAiStyle, type AiStyleReport } from "./humanize";
import { checkGrammar } from "./grammar";
import type { Role } from "./auth";

/**
 * Lume AI Analysis Workspace engine.
 *
 * Runs the same document pipeline as a formal submission — extract, clean,
 * segment, embed, compare — but against a corpus the *caller* is entitled to
 * see, so a lecturer and a student can both analyse arbitrary work without
 * either of them gaining access to the other's documents.
 *
 * Every stage writes its progress back to the Analysis row, so the workspace
 * shows genuine backend progress rather than a scripted animation.
 */

// ── Vocabulary ──────────────────────────────────────────────────────────────

export const ANALYSIS_MODULES = {
  SIMILARITY: {
    label: "Semantic similarity",
    description: "Detect conceptually similar passages, not just copied wording.",
  },
  WRITING: {
    label: "Academic writing",
    description: "Grammar, clarity, structure, academic tone and coherence.",
  },
  INTEGRITY: {
    label: "Academic integrity",
    description: "Citation coverage and attribution checks across the document.",
  },
  AI_STYLE: {
    label: "AI-style indicators",
    description:
      "Stylistic patterns associated with generated prose. Indicative only — never proof of authorship.",
  },
} as const;

export type AnalysisModule = keyof typeof ANALYSIS_MODULES;

export const ALL_MODULES = Object.keys(ANALYSIS_MODULES) as AnalysisModule[];

export type CorpusScope = "REFERENCES" | "PLATFORM";

export type AnalysisStage =
  | "QUEUED"
  | "EXTRACT"
  | "SEGMENT"
  | "EMBED"
  | "COMPARE"
  | "WRITING"
  | "REPORT"
  | "DONE";

/** Ordered stage list the workspace renders as a checklist. */
export const STAGES: { key: AnalysisStage; label: string }[] = [
  { key: "EXTRACT", label: "Extracting text" },
  { key: "SEGMENT", label: "Detecting paragraphs" },
  { key: "EMBED", label: "Generating embeddings" },
  { key: "COMPARE", label: "Comparing semantic patterns" },
  { key: "WRITING", label: "Analysing academic writing" },
  { key: "REPORT", label: "Preparing report" },
];

/** A paragraph counts as matched at or above this cosine similarity. */
const MATCH_THRESHOLD = 0.75;
const TOP_K = 5;
/** Cap corpus paragraphs so a large cohort cannot stall a CPU-only box. */
const MAX_CORPUS_CHUNKS = 4000;

// ── Report shape ────────────────────────────────────────────────────────────

export type MatchType = "VERBATIM" | "NEAR_VERBATIM" | "PARAPHRASE";

export type ReportMatch = {
  score: number;
  lexicalOverlap: number;
  matchType: MatchType;
  sourceLabel: string;
  sourceKind: "REFERENCE" | "SUBMISSION" | "ANALYSIS";
  sourceRef: string | null;
  excerpt: string;
};

export type ReportParagraph = {
  index: number;
  text: string;
  charStart: number;
  charEnd: number;
  bestScore: number;
  matches: ReportMatch[];
};

export type SimilaritySection = {
  overallScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  paragraphsAnalysed: number;
  paragraphsFlagged: number;
  /** Distinct documents in the comparison corpus. */
  comparedAgainst: number;
  corpusParagraphs: number;
  /** Score split by how the match was reached. */
  breakdown: { verbatim: number; nearVerbatim: number; paraphrase: number };
  sources: { label: string; kind: ReportMatch["sourceKind"] }[];
};

export type IntegritySection = {
  citationCount: number;
  citationsPerThousandWords: number;
  quotedPassages: number;
  unattributedClaims: { excerpt: string; marker: string }[];
};

export type AnalysisReport = {
  paragraphs: ReportParagraph[];
  similarity: SimilaritySection | null;
  writing: (WritingAnalysis & { correctnessScore: number; grammarIssues: number }) | null;
  integrity: IntegritySection | null;
  aiStyle: AiStyleReport | null;
  meta: {
    backend: "transformer" | "lexical";
    model: string;
    durationMs: number;
    wordCount: number;
    modules: AnalysisModule[];
    corpusScope: CorpusScope;
  };
};

// ── Engine ──────────────────────────────────────────────────────────────────

type CorpusEntry = {
  label: string;
  kind: ReportMatch["sourceKind"];
  ref: string | null;
  text: string;
  vector: number[];
};

/**
 * Processes one analysis end to end. Safe to re-run: every write replaces the
 * previous result for that analysis.
 */
export async function runAnalysis(analysisId: string): Promise<void> {
  const started = Date.now();

  const analysis = await db.analysis.findUnique({
    where: { id: analysisId },
    select: {
      id: true,
      userId: true,
      source: true,
      storageKey: true,
      fileType: true,
      text: true,
      modules: true,
      corpusScope: true,
      references: { orderBy: { order: "asc" }, select: { label: true, text: true } },
      user: { select: { role: true } },
    },
  });
  if (!analysis) return;

  const modules = parseModules(analysis.modules);

  const setStage = (stage: AnalysisStage) =>
    db.analysis.update({ where: { id: analysisId }, data: { stage } });

  await db.analysis.update({
    where: { id: analysisId },
    data: { status: "PROCESSING", stage: "EXTRACT", statusDetail: null },
  });

  try {
    // 1 — Extract.
    let raw = analysis.text;
    if (analysis.source === "UPLOAD" && analysis.storageKey) {
      const buffer = await getFile(analysis.storageKey);
      raw = await extractText(buffer, analysis.fileType as SupportedType);
    }

    const text = cleanText(raw);
    const wordCount = countWords(text);

    if (wordCount < 30) {
      await fail(
        analysisId,
        "Only a few words of readable text could be extracted. If this is a scanned PDF, upload a text-based version or paste the text directly.",
      );
      return;
    }

    await db.analysis.update({
      where: { id: analysisId },
      data: { text, wordCount },
    });

    // 2 — Segment.
    await setStage("SEGMENT");
    const paragraphs = detectParagraphs(text);

    // 3 — Embed. Only needed when a similarity comparison was requested.
    const wantsSimilarity = modules.includes("SIMILARITY");

    let similarity: SimilaritySection | null = null;
    let reportParagraphs: ReportParagraph[] = paragraphs.map((p) => ({
      index: p.index,
      text: p.text,
      charStart: p.charStart,
      charEnd: p.charEnd,
      bestScore: 0,
      matches: [],
    }));

    if (wantsSimilarity && paragraphs.length > 0) {
      await setStage("EMBED");

      const corpus = await buildCorpus({
        userId: analysis.userId,
        role: analysis.user.role as Role,
        scope: analysis.corpusScope as CorpusScope,
        references: analysis.references,
      });

      const vectors = await embed(paragraphs.map((p) => p.text));

      await setStage("COMPARE");
      const computed = compare(paragraphs, vectors, corpus);
      reportParagraphs = computed.paragraphs;
      similarity = computed.summary;
    }

    // 4 — Writing, integrity and AI-style analysis.
    await setStage("WRITING");

    const writing = modules.includes("WRITING")
      ? (() => {
          const analysisResult = analyzeWriting(text);
          const grammar = checkGrammar(text);
          return {
            ...analysisResult,
            correctnessScore: grammar.stats.correctnessScore,
            grammarIssues: grammar.issues.length,
          };
        })()
      : null;

    const integrity = modules.includes("INTEGRITY") ? analyseIntegrity(text) : null;
    const aiStyle = modules.includes("AI_STYLE") ? detectAiStyle(text) : null;

    // 5 — Persist.
    await setStage("REPORT");

    const report: AnalysisReport = {
      paragraphs: reportParagraphs,
      similarity,
      writing,
      integrity,
      aiStyle,
      meta: {
        backend: backendUsed(),
        model: backendUsed() === "transformer" ? EMBEDDING_MODEL_ID : "lexical-hash-384",
        durationMs: Date.now() - started,
        wordCount,
        modules,
        corpusScope: analysis.corpusScope as CorpusScope,
      },
    };

    await db.analysis.update({
      where: { id: analysisId },
      data: {
        status: "COMPLETE",
        stage: "DONE",
        statusDetail: null,
        report: JSON.stringify(report),
        similarityScore: similarity?.overallScore ?? null,
        riskLevel: similarity?.riskLevel ?? null,
        confidence: similarity?.confidence ?? null,
        writingScore: writing?.overallScore ?? null,
        aiStyleScore: aiStyle?.score ?? null,
        embeddingBackend: report.meta.backend,
        embeddingModel: report.meta.model,
        durationMs: report.meta.durationMs,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[analysis] failed", analysisId, error);
    await fail(
      analysisId,
      error instanceof Error
        ? error.message
        : "The analysis could not be completed. Please try again.",
    );
  }
}

async function fail(analysisId: string, detail: string) {
  await db.analysis.update({
    where: { id: analysisId },
    data: { status: "FAILED", stage: "DONE", statusDetail: detail },
  });
}

export function parseModules(value: string): AnalysisModule[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return ["SIMILARITY"];
    const valid = parsed.filter(
      (m): m is AnalysisModule => typeof m === "string" && m in ANALYSIS_MODULES,
    );
    return valid.length > 0 ? valid : ["SIMILARITY"];
  } catch {
    return ["SIMILARITY"];
  }
}

export function parseReport(value: string | null): AnalysisReport | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as AnalysisReport;
  } catch {
    return null;
  }
}

// ── Corpus assembly (role-scoped) ───────────────────────────────────────────

/**
 * The corpus is assembled from what this specific user is entitled to read:
 *
 * - Reference texts they pasted in — always included.
 * - PLATFORM scope, student: only their own earlier submissions and analyses,
 *   which makes it a self-plagiarism and redraft check. Never a classmate's work.
 * - PLATFORM scope, lecturer: submissions to assignments on courses they teach.
 * - PLATFORM scope, admin: every latest submission.
 *
 * Enforced here, on the server, rather than by hiding options in the UI.
 */
async function buildCorpus({
  userId,
  role,
  scope,
  references,
}: {
  userId: string;
  role: Role;
  scope: CorpusScope;
  references: { label: string; text: string }[];
}): Promise<CorpusEntry[]> {
  const entries: { label: string; kind: CorpusEntry["kind"]; ref: string | null; text: string }[] = [];

  // Reference texts, split into paragraphs so matches are passage-level.
  for (const reference of references) {
    const cleaned = cleanText(reference.text);
    for (const paragraph of detectParagraphs(cleaned, 80)) {
      entries.push({
        label: reference.label,
        kind: "REFERENCE",
        ref: null,
        text: paragraph.text,
      });
    }
  }

  if (scope === "PLATFORM") {
    const where =
      role === "ADMIN"
        ? { submission: { isLatest: true } }
        : role === "LECTURER"
          ? {
              submission: {
                isLatest: true,
                assignment: { course: { lecturerId: userId } },
              },
            }
          : { submission: { isLatest: true, studentId: userId } };

    const chunks = await db.chunk.findMany({
      where,
      take: MAX_CORPUS_CHUNKS,
      select: {
        text: true,
        embedding: true,
        submissionId: true,
        submission: {
          select: {
            id: true,
            studentId: true,
            student: { select: { fullName: true } },
            assignment: { select: { title: true } },
          },
        },
      },
    });

    for (const chunk of chunks) {
      // A student comparing against their own corpus sees their own document
      // titles; staff see the author, because they are entitled to.
      const label =
        role === "STUDENT"
          ? `Your submission — ${chunk.submission.assignment.title}`
          : `${chunk.submission.student.fullName} — ${chunk.submission.assignment.title}`;
      entries.push({
        label,
        kind: "SUBMISSION",
        ref: chunk.submission.id,
        text: chunk.text,
      });
    }
  }

  if (entries.length === 0) return [];

  // Re-embed every corpus paragraph with the *current* backend so both sides of
  // the comparison come from the same vector space. Stored submission vectors
  // may predate a model change, and mixing spaces produces meaningless cosines.
  const vectors = await embed(entries.map((e) => e.text));
  return entries.map((entry, i) => ({ ...entry, vector: vectors[i] }));
}

// ── Comparison ──────────────────────────────────────────────────────────────

function compare(
  paragraphs: { index: number; text: string; charStart: number; charEnd: number }[],
  vectors: number[][],
  corpus: CorpusEntry[],
): { paragraphs: ReportParagraph[]; summary: SimilaritySection } {
  const results: ReportParagraph[] = [];
  let weightedMatch = 0;
  let totalWeight = 0;
  let flagged = 0;
  const breakdown = { verbatim: 0, nearVerbatim: 0, paraphrase: 0 };

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const vector = vectors[i];

    const matches: ReportMatch[] = corpus
      .map((candidate) => {
        const score = cosine(vector, candidate.vector);
        const lexicalOverlap = jaccard(paragraph.text, candidate.text);
        return {
          score,
          lexicalOverlap,
          matchType: classifyMatch(score, lexicalOverlap),
          sourceLabel: candidate.label,
          sourceKind: candidate.kind,
          sourceRef: candidate.ref,
          excerpt: candidate.text,
        };
      })
      .filter((m) => m.score >= MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);

    const bestScore = matches[0]?.score ?? 0;
    const weight = Math.max(paragraph.text.length, 1);
    totalWeight += weight;

    if (bestScore >= MATCH_THRESHOLD) {
      flagged++;
      weightedMatch += bestScore * weight;
      const type = matches[0].matchType;
      if (type === "VERBATIM") breakdown.verbatim += weight;
      else if (type === "NEAR_VERBATIM") breakdown.nearVerbatim += weight;
      else breakdown.paraphrase += weight;
    }

    results.push({
      index: paragraph.index,
      text: paragraph.text,
      charStart: paragraph.charStart,
      charEnd: paragraph.charEnd,
      bestScore,
      matches,
    });
  }

  const overallScore =
    totalWeight > 0 ? Math.round((weightedMatch / totalWeight) * 1000) / 10 : 0;

  const asPercent = (weight: number) =>
    totalWeight > 0 ? Math.round((weight / totalWeight) * 1000) / 10 : 0;

  const sourceMap = new Map<string, ReportMatch["sourceKind"]>();
  for (const paragraph of results) {
    for (const match of paragraph.matches) sourceMap.set(match.sourceLabel, match.sourceKind);
  }

  return {
    paragraphs: results,
    summary: {
      overallScore,
      riskLevel: riskLevelFor(overallScore),
      // Confidence tracks how much text there was to judge from, and collapses
      // to zero with an empty corpus — a 0% score against nothing is not
      // evidence of originality.
      confidence:
        corpus.length === 0 ? 0 : Math.min(1, 0.4 + results.length * 0.08),
      paragraphsAnalysed: results.length,
      paragraphsFlagged: flagged,
      comparedAgainst: new Set(corpus.map((c) => c.ref ?? c.label)).size,
      corpusParagraphs: corpus.length,
      breakdown: {
        verbatim: asPercent(breakdown.verbatim),
        nearVerbatim: asPercent(breakdown.nearVerbatim),
        paraphrase: asPercent(breakdown.paraphrase),
      },
      sources: [...sourceMap].map(([label, kind]) => ({ label, kind })),
    },
  };
}

/**
 * Separates copying from rewording. A high cosine with high word overlap is
 * copied text; a high cosine with *low* word overlap is the paraphrase case
 * that string-matching tools miss entirely.
 */
function classifyMatch(score: number, lexicalOverlap: number): MatchType {
  if (lexicalOverlap >= 0.6) return "VERBATIM";
  if (lexicalOverlap >= 0.3) return "NEAR_VERBATIM";
  return "PARAPHRASE";
}

const STOP = new Set([
  "a","an","and","are","as","at","be","been","but","by","for","from","has","have",
  "he","in","is","it","its","of","on","or","that","the","this","to","was","were",
  "will","with","which","their","they","them","these","those","there","not","can",
]);

function contentWords(text: string): Set<string> {
  return new Set(
    (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter(
      (word) => word.length > 2 && !STOP.has(word),
    ),
  );
}

function jaccard(a: string, b: string): number {
  const setA = contentWords(a);
  const setB = contentWords(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) if (setB.has(word)) intersection++;
  return intersection / (setA.size + setB.size - intersection);
}

// ── Direct document-to-document comparison ──────────────────────────────────

export type DocumentComparison = {
  overallScore: number;
  riskLevel: RiskLevel;
  paragraphsA: number;
  paragraphsB: number;
  pairs: {
    indexA: number;
    textA: string;
    indexB: number;
    textB: string;
    score: number;
    lexicalOverlap: number;
    matchType: MatchType;
  }[];
  /** Best score per paragraph of A, in order — the heatmap strip. */
  heat: number[];
};

/**
 * Compares two documents directly, paragraph against paragraph. Used by the
 * lecturer "compare documents" screen, where the question is not "does this
 * match the cohort" but "do these two specific pieces of work match".
 */
export async function compareDocuments(
  rawA: string,
  rawB: string,
): Promise<DocumentComparison> {
  const paragraphsA = detectParagraphs(cleanText(rawA), 80);
  const paragraphsB = detectParagraphs(cleanText(rawB), 80);

  if (paragraphsA.length === 0 || paragraphsB.length === 0) {
    return {
      overallScore: 0,
      riskLevel: "ORIGINAL",
      paragraphsA: paragraphsA.length,
      paragraphsB: paragraphsB.length,
      pairs: [],
      heat: [],
    };
  }

  const [vectorsA, vectorsB] = await Promise.all([
    embed(paragraphsA.map((p) => p.text)),
    embed(paragraphsB.map((p) => p.text)),
  ]);

  const pairs: DocumentComparison["pairs"] = [];
  const heat: number[] = [];
  let weightedMatch = 0;
  let totalWeight = 0;

  for (let i = 0; i < paragraphsA.length; i++) {
    let best = { score: 0, index: -1 };
    for (let j = 0; j < paragraphsB.length; j++) {
      const score = cosine(vectorsA[i], vectorsB[j]);
      if (score > best.score) best = { score, index: j };
    }

    heat.push(best.score);
    const weight = Math.max(paragraphsA[i].text.length, 1);
    totalWeight += weight;

    if (best.score >= MATCH_THRESHOLD && best.index >= 0) {
      weightedMatch += best.score * weight;
      const lexicalOverlap = jaccard(
        paragraphsA[i].text,
        paragraphsB[best.index].text,
      );
      pairs.push({
        indexA: i,
        textA: paragraphsA[i].text,
        indexB: best.index,
        textB: paragraphsB[best.index].text,
        score: best.score,
        lexicalOverlap,
        matchType: classifyMatch(best.score, lexicalOverlap),
      });
    }
  }

  const overallScore =
    totalWeight > 0 ? Math.round((weightedMatch / totalWeight) * 1000) / 10 : 0;

  return {
    overallScore,
    riskLevel: riskLevelFor(overallScore),
    paragraphsA: paragraphsA.length,
    paragraphsB: paragraphsB.length,
    pairs: pairs.sort((a, b) => b.score - a.score),
    heat,
  };
}

// ── Integrity checks ────────────────────────────────────────────────────────

const CITATION_PATTERNS = [
  /\([A-Z][A-Za-z'-]+(?:\s(?:et al\.?|and|&)\s?[A-Za-z'-]*)?,?\s*(?:19|20)\d{2}[a-z]?(?:,\s*pp?\.\s*\d+)?\)/g,
  /\[\d{1,3}\]/g,
  /\b[A-Z][A-Za-z'-]+\s+\((?:19|20)\d{2}\)/g,
];

const CLAIM_MARKER =
  /\b(studies show|research (?:shows|suggests|indicates)|according to|it has been shown|evidence suggests|data (?:show|shows|indicate))\b/gi;

/**
 * Counts attribution present in the document and flags evidence-claims that
 * carry no nearby citation. Reported as "worth checking", never as misconduct.
 */
function analyseIntegrity(text: string): IntegritySection {
  const citationCount = CITATION_PATTERNS.reduce(
    (total, pattern) => total + (text.match(pattern)?.length ?? 0),
    0,
  );

  const quotedPassages = (text.match(/"[^"]{25,}"/g) ?? []).length;
  const words = countWords(text);

  const unattributedClaims: IntegritySection["unattributedClaims"] = [];
  for (const match of text.matchAll(CLAIM_MARKER)) {
    const start = match.index ?? 0;
    // A citation "near" a claim means in the same sentence-ish window.
    const window = text.slice(start, start + 240);
    const hasCitation = CITATION_PATTERNS.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(window);
    });
    if (!hasCitation && unattributedClaims.length < 12) {
      unattributedClaims.push({
        excerpt: text.slice(start, Math.min(start + 160, text.length)).trim(),
        marker: match[0],
      });
    }
  }

  return {
    citationCount,
    citationsPerThousandWords:
      words > 0 ? Math.round((citationCount / words) * 10000) / 10 : 0,
    quotedPassages,
    unattributedClaims,
  };
}
