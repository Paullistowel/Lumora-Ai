import "server-only";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * The research and evaluation layer.
 *
 * Everything measurable is read off disk from files the benchmark harness
 * writes. Nothing in this module invents a figure: if a results file is
 * missing, the getters return null and the research pages render
 * "Evaluation pending".
 *
 * Static content here (objectives, targets, the research gap) is the project
 * proposal restated — those are commitments, not measurements, and the UI
 * labels them as such.
 */

const DATA_DIR = resolve(process.cwd(), "data/evaluation");

// ── Measured results ────────────────────────────────────────────────────────

export type ModelResult =
  | {
      key: string;
      label: string;
      dimensions: number;
      modelId: string | null;
      status: "pending";
      reason: string;
    }
  | {
      key: string;
      label: string;
      dimensions: number;
      modelId: string | null;
      status: "measured";
      threshold: number;
      metrics: { precision: number; recall: number; f1: number; accuracy: number };
      confusion: { tp: number; fp: number; tn: number; fn: number };
      roc: { threshold: number; tpr: number; fpr: number }[];
      auc: number;
      bestThreshold: { threshold: number; f1: number };
      latency: { meanMsPerPair: number; p95MsPerPair: number; modelLoadMs: number };
      memory: { peakRssMb: number; deltaRssMb: number };
    };

export type BenchmarkResults = {
  generatedAt: string;
  status: "measured" | "pending";
  reason?: string;
  platform?: { node: string; platform: string; arch: string; cpus: number };
  dataset: {
    path: string;
    pairs: number;
    positives: number;
    negatives: number;
    kinds: string[];
  } | null;
  threshold?: number;
  models: ModelResult[];
};

export type UsabilityStudy = {
  generatedAt: string;
  instrument: "SUS";
  participants: number;
  meanScore: number;
  standardDeviation: number;
  byRole?: { role: string; participants: number; meanScore: number }[];
};

export type WritingStudy = {
  generatedAt: string;
  participants: number;
  meanBefore: number;
  meanAfter: number;
  meanImprovementPercent: number;
  pValue?: number;
  test?: string;
};

async function readJson<T>(fileName: string): Promise<T | null> {
  try {
    const raw = await readFile(resolve(DATA_DIR, fileName), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    // Absent or unreadable — the caller renders "Evaluation pending".
    return null;
  }
}

export function getBenchmarkResults() {
  return readJson<BenchmarkResults>("results.json");
}

export function getUsabilityStudy() {
  return readJson<UsabilityStudy>("sus.json");
}

export function getWritingStudy() {
  return readJson<WritingStudy>("writing-improvement.json");
}

// ── Proposal content (commitments, not measurements) ────────────────────────

export const RESEARCH_PROBLEM = {
  title: "String matching stopped measuring what it claims to measure",
  body: "Mainstream plagiarism detection compares sequences of characters. A student who spends ten minutes rewording a source scores near zero, and generative models reduced those ten minutes to seconds. Detection built on surface form now reports originality it cannot actually evidence — while the students it does catch are usually the ones who cited badly rather than the ones who copied deliberately.",
};

export const RESEARCH_GAP = {
  title: "Semantic detection has not been calibrated for Ghanaian academic writing",
  body: "Sentence-transformer models are trained predominantly on English written outside West Africa. Thresholds published in the detection literature are derived from those corpora. Whether a 0.75 cosine threshold means the same thing on Ghanaian undergraduate writing — with its own register, code-switching patterns and shared national reading lists — has not been established. Deploying an uncalibrated threshold risks systematically over-flagging a cohort.",
};

export const OBJECTIVES = [
  {
    id: "O1",
    title: "Build a semantic plagiarism engine",
    detail:
      "Paragraph-level sentence-transformer embeddings compared by cosine similarity, with per-passage evidence and source attribution.",
    status: "IMPLEMENTED" as const,
  },
  {
    id: "O2",
    title: "Provide academic writing feedback",
    detail:
      "Readability, academic tone, structure, coherence and grammar analysis with actionable guidance rather than a bare score.",
    status: "IMPLEMENTED" as const,
  },
  {
    id: "O3",
    title: "Support structured, double-blind peer review",
    detail:
      "Balanced anonymous reviewer allocation, rubric-guided scoring, and an assessment of whether each review is specific and constructive.",
    status: "IMPLEMENTED" as const,
  },
  {
    id: "O4",
    title: "Assemble a Ghanaian academic writing corpus",
    detail:
      "200+ consented, anonymised, labelled assignment pairs spanning verbatim, near-verbatim, paraphrased and same-topic-but-independent cases.",
    status: "PENDING" as const,
  },
  {
    id: "O5",
    title: "Benchmark three embedding models",
    detail:
      "all-MiniLM-L6-v2, paraphrase-mpnet-base-v2 and a MiniLM fine-tuned on the Ghanaian corpus, compared on precision, recall, F1, latency and memory.",
    status: "EXPERIMENTAL" as const,
  },
  {
    id: "O6",
    title: "Evaluate usability and writing improvement",
    detail:
      "A System Usability Scale study with students and lecturers, and a pre/post comparison of writing quality among platform users.",
    status: "PENDING" as const,
  },
  {
    id: "O7",
    title: "Run offline on CPU-only university infrastructure",
    detail:
      "No cloud inference, no third-party API, no submission leaving the institution's network.",
    status: "EXPERIMENTAL" as const,
  },
];

/**
 * The targets the proposal commits to. These are *aims*. The UI must render the
 * measured column from the benchmark files, never from this table.
 */
export const RESEARCH_TARGETS = [
  {
    id: "T1",
    metric: "Plagiarism detection precision",
    target: "≥ 85%",
    measuredBy: "Benchmark harness over the labelled pair dataset",
    source: "benchmark" as const,
  },
  {
    id: "T2",
    metric: "System Usability Scale score",
    target: "≥ 70",
    measuredBy: "SUS questionnaire with students and teaching staff",
    source: "sus" as const,
  },
  {
    id: "T3",
    metric: "Inference time per document",
    target: "< 3 seconds",
    measuredBy: "Benchmark harness latency measurement on CPU-only hardware",
    source: "benchmark" as const,
  },
  {
    id: "T4",
    metric: "Writing-quality improvement",
    target: "≥ 10%",
    measuredBy: "Pre/post writing scores for participants using the platform",
    source: "writing" as const,
  },
  {
    id: "T5",
    metric: "Offline operation",
    target: "No external network calls during analysis",
    measuredBy: "Deployment audit of outbound requests",
    source: "manual" as const,
  },
];

export const GHANA_CONTEXT = [
  {
    title: "Ghanaian academic corpus",
    body: "Consented, anonymised undergraduate writing collected from Ghanaian departments, labelled for the cases that matter: reworded sources, and independent work on a shared reading list.",
    status: "PENDING" as const,
  },
  {
    title: "Local model calibration",
    body: "Similarity thresholds are re-derived against Ghanaian writing rather than inherited from published figures, so the flagging rate reflects the cohort actually being assessed.",
    status: "PENDING" as const,
  },
  {
    title: "Low-resource deployment",
    body: "The whole pipeline runs on CPU with a ~90MB model. No GPU, no per-request API cost, and no dependency on a stable outbound connection — which is what makes it deployable on the infrastructure Ghanaian universities actually have.",
    status: "EXPERIMENTAL" as const,
  },
];

export const LIMITATIONS = [
  "Similarity is scoped to a single assignment's corpus plus sources the user supplies. There is no crawl of the public web, so a passage copied from an uncited website is only detected if that source is provided.",
  "AI-style analysis measures stylistic regularity. It cannot establish authorship, and its output must never be used as evidence that text was machine-generated.",
  "The lexical fallback embedding used when the transformer cannot load is substantially weaker at paraphrase detection. Reports state which backend produced them.",
  "Accuracy figures reported anywhere in this application come from the labelled pair dataset. Until that dataset exists, no accuracy claim is being made.",
  "Scanned PDFs without a text layer cannot be analysed; there is no OCR stage.",
];

export const FUTURE_WORK = [
  "Fine-tune MiniLM on the Ghanaian corpus and re-benchmark against the two baseline models.",
  "Cross-cohort and historical corpus search, so a submission is compared against prior years as well as its own cohort.",
  "Institutional web-source indexing under the university's control, avoiding a third-party crawl.",
  "OCR for scanned submissions.",
  "Longitudinal study of whether writing feedback changes writing over a full academic year.",
];

export const TECH_STACK = [
  { layer: "Frontend", value: "Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion" },
  { layer: "Backend", value: "Next.js server actions and route handlers on Node.js" },
  { layer: "Database", value: "Prisma 7 · SQLite in development, PostgreSQL in deployment" },
  { layer: "Embeddings", value: "transformers.js running sentence-transformers locally on CPU" },
  { layer: "Vector storage", value: "Serialised float vectors in the primary database; pgvector on PostgreSQL" },
  { layer: "Authentication", value: "Session cookies with hashed tokens (jose, bcrypt), role-based access control" },
  { layer: "Document processing", value: "pdf-parse and mammoth for PDF and Word extraction" },
  { layer: "Charts", value: "Recharts" },
];
