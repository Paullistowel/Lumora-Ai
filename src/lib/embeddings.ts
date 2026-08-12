/**
 * Embedding generation for the similarity engine.
 *
 * Primary backend is all-MiniLM-L6-v2 running locally through transformers.js
 * (384-dim, mean-pooled, L2-normalised). The first call downloads ~90MB of
 * model weights and caches them under .models/.
 *
 * If the model cannot be loaded — offline machine, restricted CI — we fall back
 * to a hashed lexical vector. It is meaningfully weaker at paraphrase detection
 * but keeps the whole pipeline functional, and `backendUsed()` tells the UI
 * which one produced a given score.
 */

/**
 * Models the project evaluates. `EMBEDDING_MODEL` selects the active one at
 * runtime, which is what lets the benchmark harness swap backends without
 * touching application code.
 */
export const MODEL_REGISTRY = {
  "all-MiniLM-L6-v2": {
    id: "Xenova/all-MiniLM-L6-v2",
    dim: 384,
    label: "all-MiniLM-L6-v2",
    note: "Baseline sentence-transformer. Small enough for CPU-only deployment.",
    available: true,
  },
  "paraphrase-mpnet-base-v2": {
    id: "Xenova/paraphrase-multilingual-mpnet-base-v2",
    dim: 768,
    label: "paraphrase-mpnet-base-v2",
    note: "Larger paraphrase-tuned model. Higher recall expected, higher cost.",
    available: true,
  },
  "ghanaian-minilm": {
    // Points at a locally fine-tuned checkpoint under MODEL_CACHE_DIR. Absent
    // until the Ghanaian corpus has been collected and the fine-tune has run.
    id: process.env.GHANAIAN_MODEL_ID ?? "local/ghanaian-minilm",
    dim: 384,
    label: "Ghanaian-writing fine-tuned MiniLM",
    note: "MiniLM fine-tuned on the Ghanaian academic corpus. Not yet trained.",
    available: Boolean(process.env.GHANAIAN_MODEL_ID),
  },
} as const;

export type ModelKey = keyof typeof MODEL_REGISTRY;

const ACTIVE_KEY = (process.env.EMBEDDING_MODEL as ModelKey) ?? "all-MiniLM-L6-v2";
const ACTIVE = MODEL_REGISTRY[ACTIVE_KEY] ?? MODEL_REGISTRY["all-MiniLM-L6-v2"];

const MODEL_ID = ACTIVE.id;
export const EMBEDDING_MODEL_ID = ACTIVE.label;
export const EMBEDDING_DIM = 384;

export type EmbeddingBackend = "transformer" | "lexical";

type Extractor = (
  texts: string[],
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist: () => number[][] }>;

let extractorPromise: Promise<Extractor | null> | null = null;
let backend: EmbeddingBackend = "lexical";

export function backendUsed(): EmbeddingBackend {
  return backend;
}

async function loadExtractor(): Promise<Extractor | null> {
  if (process.env.EMBEDDING_BACKEND === "lexical") return null;

  try {
    const { pipeline, env } = await import("@xenova/transformers");
    const cacheDir = process.env.MODEL_CACHE_DIR ?? "./.models";
    // Weights vendored by scripts/fetch-model.sh are read straight off disk;
    // otherwise transformers.js downloads and caches them here on first use.
    env.localModelPath = cacheDir;
    env.cacheDir = cacheDir;
    env.allowLocalModels = true;

    const extractor = (await pipeline(
      "feature-extraction",
      MODEL_ID,
    )) as unknown as Extractor;

    backend = "transformer";
    return extractor;
  } catch (error) {
    console.warn(
      `[embeddings] ${MODEL_ID} unavailable, using lexical fallback:`,
      error instanceof Error ? error.message : error,
    );
    backend = "lexical";
    return null;
  }
}

/** Returns one L2-normalised vector per input text, in order. */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  extractorPromise ??= loadExtractor();
  const extractor = await extractorPromise;

  if (!extractor) return texts.map(lexicalVector);

  try {
    const output = await extractor(texts, { pooling: "mean", normalize: true });
    return output.tolist();
  } catch (error) {
    console.warn("[embeddings] inference failed, using lexical fallback:", error);
    backend = "lexical";
    return texts.map(lexicalVector);
  }
}

// ── Lexical fallback ────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a","an","and","are","as","at","be","but","by","for","from","has","have","he",
  "in","is","it","its","of","on","or","that","the","this","to","was","were",
  "will","with","which","their","they","them","these","those","there","been",
]);

/**
 * Hashes unigrams and bigrams into a fixed-width vector. Same dimensionality as
 * the transformer so both backends flow through identical downstream code.
 */
function lexicalVector(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIM).fill(0);
  const tokens = (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter(
    (t) => t.length > 2 && !STOP_WORDS.has(t),
  );

  const add = (term: string, weight: number) => {
    vector[hash(term) % EMBEDDING_DIM] += weight;
  };

  for (let i = 0; i < tokens.length; i++) {
    add(tokens[i], 1);
    if (i + 1 < tokens.length) add(`${tokens[i]}_${tokens[i + 1]}`, 1.5);
  }

  // Sub-linear term frequency damping, then L2 normalise.
  for (let i = 0; i < vector.length; i++) {
    if (vector[i] > 0) vector[i] = 1 + Math.log(vector[i]);
  }
  const norm = Math.hypot(...vector);
  return norm > 0 ? vector.map((v) => v / norm) : vector;
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── Serialisation ───────────────────────────────────────────────────────────

export function serializeVector(vector: number[]): string {
  // Round to 6dp: negligible accuracy cost, ~40% smaller rows.
  return JSON.stringify(vector.map((v) => Number(v.toFixed(6))));
}

export function deserializeVector(value: string): number[] {
  return JSON.parse(value) as number[];
}
