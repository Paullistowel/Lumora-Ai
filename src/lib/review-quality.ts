import { countWords, splitSentences } from "./documents";

/**
 * Module 9 — AI Reviewer Quality Checker.
 *
 * Scores the review, never the reviewer's opinion: length, specificity,
 * whether it offers actionable suggestions, and tone. Output feeds the
 * reviewer's running quality score and flags abusive feedback for the lecturer.
 */

export type QualityBreakdown = {
  depth: number; // 0–25 — is there enough substance?
  specificity: number; // 0–25 — does it point at concrete things?
  constructiveness: number; // 0–30 — does it suggest improvements?
  respectfulness: number; // 0–20 — is the tone acceptable?
};

export type ReviewQuality = {
  score: number; // 0–100
  breakdown: QualityBreakdown;
  notes: string[];
  flagged: boolean; // needs lecturer attention
};

const SPECIFIC_MARKERS = /\b(paragraph|section|sentence|page|introduction|conclusion|abstract|methodology|figure|table|reference|citation|line|argument|thesis|结论)\b/gi;

const CONSTRUCTIVE_MARKERS = /\b(consider|suggest|recommend|try|could|should|might|would benefit|instead|improve|clarify|expand|revise|rephrase|add|strengthen)\b/gi;

const EXAMPLE_MARKERS = /\b(for example|for instance|such as|e\.g\.|specifically|in particular)\b/gi;

const DISRESPECTFUL = /\b(stupid|dumb|idiot|useless|garbage|trash|lazy|pathetic|worthless|terrible|awful|nonsense|rubbish)\b/gi;

const LOW_EFFORT = /^(good|nice|ok(ay)?|fine|great|well done|good job|nothing|n\/a|no comment|perfect|excellent)[\s.!]*$/i;

export function assessReviewQuality(
  comment: string,
  criterionComments: string[] = [],
): ReviewQuality {
  const text = [comment, ...criterionComments].filter(Boolean).join("\n\n").trim();
  const notes: string[] = [];

  if (!text || LOW_EFFORT.test(text)) {
    return {
      score: 0,
      breakdown: { depth: 0, specificity: 0, constructiveness: 0, respectfulness: 20 },
      notes: ["The review offers no substantive feedback."],
      flagged: true,
    };
  }

  const words = countWords(text);
  const sentences = splitSentences(text).length;

  // ── Depth (0–25) ──────────────────────────────────────────────────────────
  let depth = 0;
  if (words >= 150) depth = 25;
  else if (words >= 80) depth = 20;
  else if (words >= 40) depth = 14;
  else if (words >= 20) depth = 8;
  else depth = 3;

  if (words < 40) notes.push(`Only ${words} words — too brief to guide a revision.`);
  if (sentences <= 1 && words < 60) notes.push("A single sentence rarely covers a full piece of work.");

  // ── Specificity (0–25) ────────────────────────────────────────────────────
  const specificHits = (text.match(SPECIFIC_MARKERS) ?? []).length;
  const quotes = (text.match(/"[^"]{8,}"/g) ?? []).length;
  const specificity = Math.min(25, specificHits * 5 + quotes * 6);
  if (specificity < 10) {
    notes.push("Feedback is general — name the paragraph or section you mean.");
  }

  // ── Constructiveness (0–30) ───────────────────────────────────────────────
  const constructiveHits = (text.match(CONSTRUCTIVE_MARKERS) ?? []).length;
  const exampleHits = (text.match(EXAMPLE_MARKERS) ?? []).length;
  const constructiveness = Math.min(30, constructiveHits * 6 + exampleHits * 8);
  if (constructiveness < 12) {
    notes.push("Identifies problems without proposing fixes — add a concrete suggestion.");
  }
  if (exampleHits > 0) notes.push("Good use of examples to illustrate the point.");

  // ── Respectfulness (0–20) ─────────────────────────────────────────────────
  const rudeHits = (text.match(DISRESPECTFUL) ?? []).length;
  const shouting = /\b[A-Z]{5,}\b/.test(text);
  let respectfulness = 20;
  respectfulness -= rudeHits * 10;
  if (shouting) respectfulness -= 4;
  respectfulness = Math.max(0, respectfulness);

  if (rudeHits > 0) {
    notes.push("Contains dismissive language — critique the work, not the author.");
  }

  const breakdown: QualityBreakdown = {
    depth,
    specificity,
    constructiveness,
    respectfulness,
  };

  const score = Math.round(
    breakdown.depth +
      breakdown.specificity +
      breakdown.constructiveness +
      breakdown.respectfulness,
  );

  if (score >= 80) notes.unshift("Thorough, specific and actionable review.");

  return { score, breakdown, notes, flagged: rudeHits > 0 || score < 30 };
}
