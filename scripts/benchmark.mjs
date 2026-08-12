#!/usr/bin/env node
/**
 * Lume AI — model benchmark harness.
 *
 * Measures the three candidate embedding models against a labelled set of
 * assignment pairs and writes the result to data/evaluation/results.json, which
 * is what the /research page reads.
 *
 * This script produces numbers ONLY from data you supply. It never invents a
 * score: if data/corpus/pairs.jsonl is missing or a model cannot be loaded,
 * that model is recorded as "pending" with the reason, and the research page
 * shows "Evaluation pending" rather than a figure.
 *
 * Usage:
 *   npm run benchmark                       # every available model
 *   npm run benchmark -- --model all-MiniLM-L6-v2
 *   npm run benchmark -- --threshold 0.8
 *
 * Dataset format — one JSON object per line in data/corpus/pairs.jsonl:
 *   {"id":"p001","a":"…text…","b":"…text…","label":1,"kind":"paraphrase"}
 *   label: 1 = the pair IS derived from the same source (positive)
 *          0 = the pair is independent (negative)
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DATASET = resolve(ROOT, "data/corpus/pairs.jsonl");
const OUTPUT = resolve(ROOT, "data/evaluation/results.json");
const CACHE_DIR = process.env.MODEL_CACHE_DIR ?? resolve(ROOT, ".models");

const MODELS = [
  {
    key: "all-MiniLM-L6-v2",
    id: "Xenova/all-MiniLM-L6-v2",
    label: "all-MiniLM-L6-v2",
    dimensions: 384,
  },
  {
    key: "paraphrase-mpnet-base-v2",
    id: "Xenova/paraphrase-multilingual-mpnet-base-v2",
    label: "paraphrase-mpnet-base-v2",
    dimensions: 768,
  },
  {
    key: "ghanaian-minilm",
    id: process.env.GHANAIAN_MODEL_ID ?? null,
    label: "Ghanaian-writing fine-tuned MiniLM",
    dimensions: 384,
  },
];

// ── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const only = flag("model", null);
const threshold = Number(flag("threshold", "0.75"));

// ── Dataset ─────────────────────────────────────────────────────────────────

async function loadDataset() {
  if (!existsSync(DATASET)) return null;

  const raw = await readFile(DATASET, "utf8");
  const pairs = [];
  let lineNumber = 0;

  for (const line of raw.split("\n")) {
    lineNumber++;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;
    let record;
    try {
      record = JSON.parse(trimmed);
    } catch {
      console.warn(`  ! skipping malformed line ${lineNumber}`);
      continue;
    }
    if (typeof record.a !== "string" || typeof record.b !== "string") {
      console.warn(`  ! skipping line ${lineNumber}: missing a/b text`);
      continue;
    }
    if (record.label !== 0 && record.label !== 1) {
      console.warn(`  ! skipping line ${lineNumber}: label must be 0 or 1`);
      continue;
    }
    pairs.push({
      id: record.id ?? `pair-${pairs.length + 1}`,
      a: record.a,
      b: record.b,
      label: record.label,
      kind: record.kind ?? null,
    });
  }

  return pairs.length > 0 ? pairs : null;
}

// ── Metrics ─────────────────────────────────────────────────────────────────

function cosine(a, b) {
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

function confusionAt(scores, labels, cut) {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (let i = 0; i < scores.length; i++) {
    const predicted = scores[i] >= cut ? 1 : 0;
    if (predicted === 1 && labels[i] === 1) tp++;
    else if (predicted === 1 && labels[i] === 0) fp++;
    else if (predicted === 0 && labels[i] === 0) tn++;
    else fn++;
  }
  return { tp, fp, tn, fn };
}

function metricsFrom({ tp, fp, tn, fn }) {
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = tp + fp + tn + fn > 0 ? (tp + tn) / (tp + fp + tn + fn) : 0;
  return {
    precision: round(precision),
    recall: round(recall),
    f1: round(f1),
    accuracy: round(accuracy),
  };
}

/**
 * ROC curve and its area.
 *
 * Thresholds come from the observed scores, not a fixed 0–1 grid: cosine
 * similarity between unrelated passages is frequently negative, so a grid
 * starting at 0 never reaches the (1,1) corner and understates the area badly.
 * Sweeping the actual score range guarantees the curve spans corner to corner.
 */
function rocCurve(scores, labels) {
  const positives = labels.filter((label) => label === 1).length;
  const negatives = labels.length - positives;
  if (positives === 0 || negatives === 0) {
    return { points: [], auc: 0, note: "ROC needs both positive and negative pairs." };
  }

  // Descending unique scores; each becomes a cut point, plus one above the max
  // so the curve starts at (0,0).
  const cuts = [...new Set(scores)].sort((a, b) => b - a);
  const points = [{ threshold: round(cuts[0] + 1e-6), tpr: 0, fpr: 0 }];

  for (const cut of cuts) {
    const { tp, fp } = confusionAt(scores, labels, cut);
    points.push({
      threshold: round(cut),
      tpr: round(tp / positives),
      fpr: round(fp / negatives),
    });
  }

  // Trapezoidal integration along the curve as the threshold falls, which
  // walks FPR monotonically from 0 to 1.
  let auc = 0;
  for (let i = 1; i < points.length; i++) {
    const width = points[i].fpr - points[i - 1].fpr;
    auc += width * ((points[i].tpr + points[i - 1].tpr) / 2);
  }

  return { points, auc: round(auc) };
}

/** The threshold that maximises F1 — reported so the default can be justified. */
function bestThreshold(scores, labels) {
  let best = { threshold: 0.75, f1: -1 };
  for (let cut = 0.3; cut <= 0.98; cut += 0.01) {
    const { f1 } = metricsFrom(confusionAt(scores, labels, cut));
    if (f1 > best.f1) best = { threshold: round(cut), f1: round(f1) };
  }
  return best;
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[index] * 100) / 100;
}

// ── Benchmark one model ─────────────────────────────────────────────────────

async function benchmarkModel(model, pairs) {
  if (!model.id) {
    return {
      ...stripId(model),
      status: "pending",
      reason:
        "No checkpoint configured. Set GHANAIAN_MODEL_ID once the model has been fine-tuned on the Ghanaian academic corpus.",
    };
  }

  console.log(`\n▸ ${model.label}`);
  let extractor;
  const loadStart = performance.now();

  try {
    const { pipeline, env } = await import("@xenova/transformers");
    env.localModelPath = CACHE_DIR;
    env.cacheDir = CACHE_DIR;
    env.allowLocalModels = true;
    extractor = await pipeline("feature-extraction", model.id);
  } catch (error) {
    console.log(`  ! could not load: ${error.message}`);
    return {
      ...stripId(model),
      status: "pending",
      reason: `Model could not be loaded on this machine: ${error.message}`,
    };
  }

  const loadMs = Math.round(performance.now() - loadStart);
  const baselineRss = process.memoryUsage().rss;

  const scores = [];
  const labels = [];
  const latencies = [];
  let peakRss = baselineRss;

  for (const [index, pair] of pairs.entries()) {
    const start = performance.now();
    const output = await extractor([pair.a, pair.b], {
      pooling: "mean",
      normalize: true,
    });
    latencies.push(performance.now() - start);

    const [vectorA, vectorB] = output.tolist();
    scores.push(cosine(vectorA, vectorB));
    labels.push(pair.label);

    peakRss = Math.max(peakRss, process.memoryUsage().rss);

    if ((index + 1) % 25 === 0) {
      process.stdout.write(`  … ${index + 1}/${pairs.length}\r`);
    }
  }

  const confusion = confusionAt(scores, labels, threshold);
  const roc = rocCurve(scores, labels);
  const tuned = bestThreshold(scores, labels);
  const meanLatency =
    latencies.reduce((sum, value) => sum + value, 0) / latencies.length;

  console.log(
    `  ✓ ${pairs.length} pairs · F1 ${metricsFrom(confusion).f1} · ${Math.round(meanLatency)}ms/pair`,
  );

  return {
    ...stripId(model),
    status: "measured",
    threshold,
    metrics: metricsFrom(confusion),
    confusion,
    roc: roc.points,
    auc: roc.auc,
    bestThreshold: tuned,
    latency: {
      meanMsPerPair: Math.round(meanLatency * 100) / 100,
      p95MsPerPair: percentile(latencies, 95),
      modelLoadMs: loadMs,
    },
    memory: {
      peakRssMb: Math.round(peakRss / 1024 / 1024),
      deltaRssMb: Math.round((peakRss - baselineRss) / 1024 / 1024),
    },
  };
}

function stripId(model) {
  return {
    key: model.key,
    label: model.label,
    dimensions: model.dimensions,
    modelId: model.id,
  };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Lume AI — model benchmark\n");

  const pairs = await loadDataset();

  if (!pairs) {
    console.log(
      `No labelled dataset found at ${DATASET}.\n` +
        "Nothing will be measured. See data/corpus/README.md for the format.\n" +
        "Writing a 'pending' result so the research page states this honestly.",
    );

    await write({
      generatedAt: new Date().toISOString(),
      status: "pending",
      reason:
        "No labelled assignment-pair dataset is present. The benchmark has not been run.",
      dataset: null,
      models: MODELS.map((model) => ({
        ...stripId(model),
        status: "pending",
        reason: "Awaiting the labelled evaluation dataset.",
      })),
    });
    return;
  }

  const positives = pairs.filter((p) => p.label === 1).length;
  console.log(
    `Dataset: ${pairs.length} pairs (${positives} positive, ${pairs.length - positives} negative)`,
  );
  console.log(`Decision threshold: ${threshold}`);

  const selected = only ? MODELS.filter((m) => m.key === only) : MODELS;
  if (selected.length === 0) {
    console.error(`Unknown model "${only}". Options: ${MODELS.map((m) => m.key).join(", ")}`);
    process.exit(1);
  }

  const results = [];
  for (const model of selected) {
    results.push(await benchmarkModel(model, pairs));
  }

  await write({
    generatedAt: new Date().toISOString(),
    status: results.some((r) => r.status === "measured") ? "measured" : "pending",
    platform: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: (await import("node:os")).cpus().length,
    },
    dataset: {
      path: "data/corpus/pairs.jsonl",
      pairs: pairs.length,
      positives,
      negatives: pairs.length - positives,
      kinds: [...new Set(pairs.map((p) => p.kind).filter(Boolean))],
    },
    threshold,
    models: results,
  });

  console.log(`\nWritten to ${OUTPUT}`);
}

async function write(payload) {
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
