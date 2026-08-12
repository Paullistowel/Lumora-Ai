import { countWords, splitSentences } from "./documents";

/**
 * Module 6 — AI Writing Assistant.
 *
 * Runs entirely locally: readability formulae plus targeted linguistic checks.
 * No API key, no per-request cost, deterministic output — which also makes the
 * "writing improvement over time" analytics comparable across semesters.
 */

export type IssueCategory =
  | "TONE"
  | "PASSIVE_VOICE"
  | "WORDINESS"
  | "STRUCTURE"
  | "READABILITY"
  | "CITATION"
  | "TRANSITIONS"
  | "VOCABULARY";

export type Severity = "LOW" | "MEDIUM" | "HIGH";

export type WritingIssue = {
  category: IssueCategory;
  severity: Severity;
  message: string;
  suggestion: string;
  excerpt?: string;
  count?: number;
};

export type WritingAnalysis = {
  readabilityScore: number;
  gradeLevel: number;
  academicToneScore: number;
  overallScore: number;
  issues: WritingIssue[];
  strengths: string[];
};

const INFORMAL_TERMS = [
  "a lot","lots of","kind of","sort of","stuff","things","huge","tons of",
  "basically","actually","really","very","totally","pretty much","get","got",
  "big","nowadays","okay","anyway",
];

const CONTRACTIONS = /\b(can't|won't|don't|doesn't|isn't|aren't|wasn't|weren't|didn't|couldn't|shouldn't|wouldn't|it's|that's|there's|they're|we're|you're|i'm|let's)\b/gi;

const FIRST_PERSON = /\b(i|me|my|mine|we|us|our|ours)\b/gi;

const WORDY_PHRASES: [RegExp, string][] = [
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bat this point in time\b/gi, "now"],
  [/\bin the event that\b/gi, "if"],
  [/\bfor the purpose of\b/gi, "for"],
  [/\bit is important to note that\b/gi, "(remove — state the point directly)"],
  [/\bthe fact that\b/gi, "that"],
  [/\ba large number of\b/gi, "many"],
  [/\bin spite of the fact that\b/gi, "although"],
  [/\bwith regard to\b/gi, "about"],
];

const PASSIVE = /\b(?:is|are|was|were|be|been|being|has been|have been|had been)\s+(?:\w+ly\s+)?(\w+(?:ed|en))\b/gi;

const TRANSITIONS = [
  "however","therefore","furthermore","moreover","consequently","in contrast",
  "nevertheless","additionally","similarly","conversely","thus","hence",
  "for example","for instance","in addition","as a result","on the other hand",
];

const CITATION_PATTERNS = [
  /\([A-Z][A-Za-z'-]+(?:\s(?:et al\.?|and|&)\s?[A-Za-z'-]*)?,?\s*(?:19|20)\d{2}[a-z]?(?:,\s*p{1,2}\.\s*\d+)?\)/g, // (Author, 2020)
  /\[\d{1,3}\]/g, // [1] IEEE
  /\b[A-Z][A-Za-z'-]+\s+\((?:19|20)\d{2}\)/g, // Author (2020)
];

const CLAIM_MARKERS = /\b(studies show|research (?:shows|suggests|indicates)|according to|it has been shown|evidence suggests|data (?:shows|indicate))\b/gi;

export function analyzeWriting(text: string): WritingAnalysis {
  const issues: WritingIssue[] = [];
  const strengths: string[] = [];

  const sentences = splitSentences(text);
  const words = countWords(text);
  const syllables = countSyllables(text);
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 40);

  if (words < 50) {
    return {
      readabilityScore: 0,
      gradeLevel: 0,
      academicToneScore: 0,
      overallScore: 0,
      issues: [
        {
          category: "STRUCTURE",
          severity: "HIGH",
          message: "The document is too short to analyse.",
          suggestion: "Submit at least a few paragraphs of prose.",
        },
      ],
      strengths: [],
    };
  }

  const wordsPerSentence = words / Math.max(sentences.length, 1);
  const syllablesPerWord = syllables / words;

  // Flesch reading ease and Flesch–Kincaid grade level.
  const readability = clamp(
    206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord,
    0,
    100,
  );
  const gradeLevel = Math.max(
    0,
    0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59,
  );

  // ── Tone ──────────────────────────────────────────────────────────────────
  const lower = text.toLowerCase();
  const informalHits = INFORMAL_TERMS.filter((term) =>
    new RegExp(`\\b${term.replace(/ /g, "\\s+")}\\b`, "i").test(lower),
  );
  const contractionCount = (text.match(CONTRACTIONS) ?? []).length;
  const firstPersonCount = (text.match(FIRST_PERSON) ?? []).length;
  const firstPersonRate = (firstPersonCount / words) * 100;

  let toneScore = 100;
  toneScore -= Math.min(30, informalHits.length * 5);
  toneScore -= Math.min(20, contractionCount * 4);
  toneScore -= Math.min(20, Math.max(0, firstPersonRate - 1) * 8);
  toneScore = clamp(toneScore, 0, 100);

  if (informalHits.length > 0) {
    issues.push({
      category: "TONE",
      severity: informalHits.length > 4 ? "HIGH" : "MEDIUM",
      message: `Informal vocabulary appears ${informalHits.length} time(s).`,
      suggestion: `Replace colloquial terms with precise academic alternatives — e.g. "${informalHits[0]}".`,
      excerpt: informalHits.slice(0, 5).join(", "),
      count: informalHits.length,
    });
  }

  if (contractionCount > 0) {
    issues.push({
      category: "TONE",
      severity: contractionCount > 5 ? "MEDIUM" : "LOW",
      message: `${contractionCount} contraction(s) found.`,
      suggestion: 'Expand contractions in formal writing — "doesn\'t" becomes "does not".',
      count: contractionCount,
    });
  }

  if (firstPersonRate > 2) {
    issues.push({
      category: "TONE",
      severity: "MEDIUM",
      message: `First-person pronouns make up ${firstPersonRate.toFixed(1)}% of the text.`,
      suggestion:
        'Prefer impersonal constructions — "This study examines…" rather than "I looked at…" — unless your discipline permits first person.',
      count: firstPersonCount,
    });
  }

  // ── Passive voice ─────────────────────────────────────────────────────────
  const passiveMatches = text.match(PASSIVE) ?? [];
  const passiveRate = (passiveMatches.length / Math.max(sentences.length, 1)) * 100;
  if (passiveRate > 25) {
    issues.push({
      category: "PASSIVE_VOICE",
      severity: passiveRate > 45 ? "HIGH" : "MEDIUM",
      message: `Roughly ${passiveRate.toFixed(0)}% of sentences use passive voice.`,
      suggestion:
        "Convert some to active voice so the actor is explicit; keep passive where the method matters more than the researcher.",
      excerpt: passiveMatches[0],
      count: passiveMatches.length,
    });
  } else if (passiveMatches.length > 0 && passiveRate < 20) {
    strengths.push("Balanced use of active and passive voice.");
  }

  // ── Wordiness ─────────────────────────────────────────────────────────────
  const wordy: string[] = [];
  for (const [pattern, replacement] of WORDY_PHRASES) {
    const found = text.match(pattern);
    if (found) wordy.push(`"${found[0]}" → "${replacement}"`);
  }
  if (wordy.length > 0) {
    issues.push({
      category: "WORDINESS",
      severity: wordy.length > 3 ? "MEDIUM" : "LOW",
      message: `${wordy.length} wordy phrase(s) could be tightened.`,
      suggestion: wordy.slice(0, 4).join("; "),
      count: wordy.length,
    });
  }

  // ── Sentence structure ────────────────────────────────────────────────────
  const longSentences = sentences.filter((s) => countWords(s) > 40);
  if (longSentences.length > 0) {
    issues.push({
      category: "STRUCTURE",
      severity: longSentences.length > 3 ? "HIGH" : "MEDIUM",
      message: `${longSentences.length} sentence(s) exceed 40 words.`,
      suggestion: "Split long sentences at their main clause boundary so each carries one idea.",
      excerpt: `${longSentences[0].slice(0, 140)}…`,
      count: longSentences.length,
    });
  }

  const lengths = sentences.map((s) => countWords(s));
  const variance = stdDev(lengths);
  if (lengths.length > 5 && variance < 4) {
    issues.push({
      category: "STRUCTURE",
      severity: "LOW",
      message: "Sentence lengths are very uniform.",
      suggestion: "Vary sentence length to control pace and emphasis.",
    });
  } else if (lengths.length > 5 && variance >= 6) {
    strengths.push("Good variation in sentence length.");
  }

  // ── Readability ───────────────────────────────────────────────────────────
  if (readability < 30) {
    issues.push({
      category: "READABILITY",
      severity: "MEDIUM",
      message: `Reading ease is ${readability.toFixed(0)}/100 (very difficult).`,
      suggestion: "Shorten sentences and reduce multi-syllable jargon where a plainer word carries the same meaning.",
    });
  } else if (readability > 70) {
    issues.push({
      category: "READABILITY",
      severity: "LOW",
      message: `Reading ease is ${readability.toFixed(0)}/100 — informal for academic prose.`,
      suggestion: "Some technical precision and subordinate clauses would raise the register.",
    });
  } else {
    strengths.push(`Readability sits in the academic range (${readability.toFixed(0)}/100).`);
  }

  // ── Citations ─────────────────────────────────────────────────────────────
  const citationCount = CITATION_PATTERNS.reduce(
    (total, pattern) => total + (text.match(pattern) ?? []).length,
    0,
  );
  const claimCount = (text.match(CLAIM_MARKERS) ?? []).length;

  if (citationCount === 0 && words > 300) {
    issues.push({
      category: "CITATION",
      severity: "HIGH",
      message: "No citations detected.",
      suggestion: "Attribute every external claim using your department's style (APA, IEEE, Harvard or MLA).",
    });
  } else if (claimCount > citationCount && claimCount > 1) {
    issues.push({
      category: "CITATION",
      severity: "MEDIUM",
      message: `${claimCount} evidence claim(s) but only ${citationCount} citation(s).`,
      suggestion: 'Phrases such as "studies show" need a specific source attached.',
      count: claimCount - citationCount,
    });
  } else if (citationCount > 0) {
    strengths.push(`${citationCount} citation(s) detected and attributed.`);
  }

  // ── Transitions & cohesion ────────────────────────────────────────────────
  const transitionCount = TRANSITIONS.filter((t) =>
    new RegExp(`\\b${t}\\b`, "i").test(lower),
  ).length;
  if (paragraphs.length > 2 && transitionCount < 2) {
    issues.push({
      category: "TRANSITIONS",
      severity: "MEDIUM",
      message: "Few transition words connect your paragraphs.",
      suggestion:
        'Signal the logical relationship between paragraphs — "however", "consequently", "in contrast".',
    });
  } else if (transitionCount >= 4) {
    strengths.push("Paragraphs are linked with clear transitions.");
  }

  // ── Vocabulary richness ───────────────────────────────────────────────────
  const tokens = (lower.match(/[a-z']+/g) ?? []).filter((w) => w.length > 3);
  const richness = new Set(tokens).size / Math.max(tokens.length, 1);
  if (richness < 0.35 && tokens.length > 200) {
    issues.push({
      category: "VOCABULARY",
      severity: "LOW",
      message: `Lexical variety is low (${(richness * 100).toFixed(0)}% unique terms).`,
      suggestion: "Watch for repeated key terms where a synonym or pronoun would read better.",
    });
  } else if (richness > 0.5) {
    strengths.push("Varied and precise vocabulary.");
  }

  // ── Paragraph quality ─────────────────────────────────────────────────────
  if (paragraphs.length < 3 && words > 400) {
    issues.push({
      category: "STRUCTURE",
      severity: "MEDIUM",
      message: "The text has very few paragraph breaks.",
      suggestion: "Give each distinct idea its own paragraph with a clear topic sentence.",
    });
  }

  const overallScore = clamp(
    Math.round(
      toneScore * 0.3 +
        readabilityBand(readability) * 0.25 +
        penaltyScore(issues) * 0.45,
    ),
    0,
    100,
  );

  return {
    readabilityScore: round1(readability),
    gradeLevel: round1(gradeLevel),
    academicToneScore: round1(toneScore),
    overallScore,
    issues: issues.sort(
      (a, b) => severityRank(b.severity) - severityRank(a.severity),
    ),
    strengths,
  };
}

/** Rewards prose in the 40–70 reading-ease band typical of academic writing. */
function readabilityBand(score: number): number {
  if (score >= 40 && score <= 70) return 100;
  if (score < 40) return clamp(100 - (40 - score) * 1.5, 0, 100);
  return clamp(100 - (score - 70) * 1.5, 0, 100);
}

function penaltyScore(issues: WritingIssue[]): number {
  const penalty = issues.reduce(
    (total, issue) =>
      total + (issue.severity === "HIGH" ? 15 : issue.severity === "MEDIUM" ? 8 : 3),
    0,
  );
  return clamp(100 - penalty, 0, 100);
}

function severityRank(severity: Severity) {
  return severity === "HIGH" ? 3 : severity === "MEDIUM" ? 2 : 1;
}

function countSyllables(text: string): number {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  return words.reduce((total, word) => total + syllablesInWord(word), 0);
}

function syllablesInWord(word: string): number {
  if (word.length <= 3) return 1;
  const trimmed = word
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");
  return Math.max(1, (trimmed.match(/[aeiouy]{1,2}/g) ?? []).length);
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((total, v) => total + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}
