/**
 * Humanizer — rewrites prose that reads as machine-generated into something
 * closer to considered human academic writing.
 *
 * Two honest caveats, surfaced in the UI rather than buried here:
 *
 * 1. This is a *style* tool, not an evasion tool. It removes the vocabulary and
 *    rhythm tics that make text feel synthetic; it does not launder authorship.
 *    If a department requires AI-use disclosure, using this does not discharge
 *    that obligation, and the app says so on the page.
 * 2. The detector below reports *stylistic* AI-likeness, not provenance. Uniform
 *    sentence length and a dense cluster of hedging phrases are correlated with
 *    generated text, but plenty of human writing looks like that too. It is
 *    presented as a writing-quality signal, never as an accusation.
 */

export type HumanizeChange = {
  kind: "PHRASE" | "HEDGE" | "TRANSITION" | "NOMINALISATION" | "RHYTHM" | "PUNCTUATION";
  before: string;
  after: string;
  reason: string;
};

export type HumanizeResult = {
  text: string;
  changes: HumanizeChange[];
  before: AiStyleReport;
  after: AiStyleReport;
};

export type AiStyleReport = {
  /** 0–100. Higher means the prose reads as more machine-like. */
  score: number;
  signals: { label: string; detail: string; weight: number }[];
  metrics: {
    sentenceLengthVariance: number;
    averageSentenceLength: number;
    tellPhraseCount: number;
    hedgeDensity: number;
    transitionDensity: number;
    uniqueWordRatio: number;
  };
};

/** Phrases that appear far more often in generated text than in student prose. */
const TELL_PHRASES: [RegExp, string][] = [
  [/\bit is important to note that\b/gi, ""],
  [/\bit is worth noting that\b/gi, ""],
  [/\bit should be noted that\b/gi, ""],
  [/\bit is crucial to understand that\b/gi, ""],
  [/\bdelve into\b/gi, "examine"],
  [/\bdelving into\b/gi, "examining"],
  [/\bin today's (?:fast-paced |rapidly changing |modern )?world\b/gi, "currently"],
  [/\bin the realm of\b/gi, "in"],
  [/\bin the landscape of\b/gi, "in"],
  [/\bplays a (?:crucial|vital|pivotal|key|significant) role in\b/gi, "shapes"],
  [/\bserves as a testament to\b/gi, "demonstrates"],
  [/\ba testament to\b/gi, "evidence of"],
  [/\bnavigate the complexities of\b/gi, "work through"],
  [/\bunlock the potential of\b/gi, "make use of"],
  [/\bharness the power of\b/gi, "use"],
  [/\bshed light on\b/gi, "clarify"],
  [/\bpave the way for\b/gi, "enable"],
  [/\bcornerstone of\b/gi, "basis of"],
  [/\bmultifaceted\b/gi, "complex"],
  [/\bmyriad of\b/gi, "many"],
  [/\bplethora of\b/gi, "many"],
  [/\bvast array of\b/gi, "range of"],
  [/\bever-evolving\b/gi, "changing"],
  [/\bever-increasing\b/gi, "growing"],
  [/\bcutting-edge\b/gi, "recent"],
  [/\bstate-of-the-art\b/gi, "current"],
  [/\bgame-changer\b/gi, "significant shift"],
  [/\brobust and comprehensive\b/gi, "thorough"],
  [/\bcomprehensive understanding of\b/gi, "clear grasp of"],
  [/\bin conclusion, it can be said that\b/gi, "In conclusion,"],
  [/\bembark on a journey\b/gi, "begin"],
  [/\bat the forefront of\b/gi, "leading"],
  [/\bunderscores the importance of\b/gi, "shows why .* matters"],
  [/\bfoster(?:s|ing)? a deeper understanding\b/gi, "clarifies"],
  [/\btapestry of\b/gi, "range of"],
  [/\brealm of possibilities\b/gi, "possibilities"],
  [/\bparadigm shift\b/gi, "fundamental change"],
  [/\bsynergy\b/gi, "combined effect"],
  [/\bleverage\b/gi, "use"],
  [/\butilise\b/gi, "use"],
  [/\butilize\b/gi, "use"],
  [/\bfacilitate\b/gi, "help"],
  [/\bendeavour to\b/gi, "try to"],
  [/\bcommence\b/gi, "begin"],
  [/\bterminate\b/gi, "end"],
  [/\bsubsequent to\b/gi, "after"],
  [/\bprior to\b/gi, "before"],
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
];

/** Stacked hedges — one is fine, three in a sentence is a tell. */
const HEDGES = [
  "arguably", "generally", "typically", "often", "somewhat", "relatively",
  "potentially", "possibly", "perhaps", "largely", "broadly", "essentially",
  "fundamentally", "notably", "significantly", "considerably", "substantially",
];

/** Formulaic connectives, with plainer alternatives. */
const TRANSITION_SWAPS: [RegExp, string[]][] = [
  [/\bFurthermore,\s*/g, ["In addition, ", "Beyond that, ", "Also, "]],
  [/\bMoreover,\s*/g, ["In addition, ", "What is more, ", "Beyond this, "]],
  [/\bAdditionally,\s*/g, ["In addition, ", "As well as this, "]],
  [/\bConsequently,\s*/g, ["As a result, ", "So ", "This means "]],
  [/\bNevertheless,\s*/g, ["Even so, ", "Still, ", "That said, "]],
  [/\bNonetheless,\s*/g, ["Even so, ", "Still, "]],
  [/\bIn conclusion,\s*/g, ["Overall, ", "Taken together, ", "On balance, "]],
  [/\bTo summarise,\s*/g, ["In short, ", "Overall, "]],
  [/\bIn summary,\s*/g, ["In short, ", "Overall, "]],
];

/** Verb hiding inside a noun: "conduct an analysis of" → "analyse". */
const NOMINALISATIONS: [RegExp, string][] = [
  [/\bconduct(?:s|ed|ing)? an? (?:analysis|assessment|evaluation) of\b/gi, "analyse"],
  [/\bcarry out an? (?:investigation|examination) (?:of|into)\b/gi, "investigate"],
  [/\bmake(?:s)? a contribution to\b/gi, "contributes to"],
  [/\bprovide(?:s)? an explanation (?:of|for)\b/gi, "explains"],
  [/\bgive(?:s)? consideration to\b/gi, "considers"],
  [/\bplace(?:s)? emphasis on\b/gi, "emphasises"],
  [/\breach(?:es)? a conclusion\b/gi, "concludes"],
  [/\bperform(?:s)? a comparison of\b/gi, "compares"],
  [/\bundertake(?:s)? a review of\b/gi, "reviews"],
  [/\bhas the capability to\b/gi, "can"],
  [/\bis reflective of\b/gi, "reflects"],
  [/\bis indicative of\b/gi, "indicates"],
  [/\bis suggestive of\b/gi, "suggests"],
];

// ── Detection ───────────────────────────────────────────────────────────────

export function detectAiStyle(text: string): AiStyleReport {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const words = text.match(/[A-Za-z0-9'-]+/g) ?? [];
  const wordCount = words.length;

  if (wordCount < 40) {
    return {
      score: 0,
      signals: [
        { label: "Too short", detail: "Paste at least 40 words for a reliable read.", weight: 0 },
      ],
      metrics: {
        sentenceLengthVariance: 0, averageSentenceLength: 0, tellPhraseCount: 0,
        hedgeDensity: 0, transitionDensity: 0, uniqueWordRatio: 0,
      },
    };
  }

  const lengths = sentences.map((s) => (s.match(/[A-Za-z0-9'-]+/g) ?? []).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / Math.max(lengths.length, 1);
  const variance = Math.sqrt(
    lengths.reduce((total, l) => total + (l - mean) ** 2, 0) / Math.max(lengths.length, 1),
  );

  const tellCount = TELL_PHRASES.reduce(
    (total, [pattern]) => total + (text.match(pattern)?.length ?? 0),
    0,
  );

  const hedgeCount = HEDGES.reduce(
    (total, hedge) =>
      total + (text.match(new RegExp(`\\b${hedge}\\b`, "gi"))?.length ?? 0),
    0,
  );
  const hedgeDensity = (hedgeCount / wordCount) * 100;

  const transitionCount = TRANSITION_SWAPS.reduce(
    (total, [pattern]) => total + (text.match(pattern)?.length ?? 0),
    0,
  );
  const transitionDensity = (transitionCount / Math.max(sentences.length, 1)) * 100;

  const lower = words.map((w) => w.toLowerCase()).filter((w) => w.length > 3);
  const uniqueWordRatio = new Set(lower).size / Math.max(lower.length, 1);

  const signals: { label: string; detail: string; weight: number }[] = [];
  let score = 0;

  // Uniform sentence length is the strongest single signal.
  if (variance < 4 && lengths.length >= 4) {
    const w = 26;
    score += w;
    signals.push({
      label: "Uniform sentence length",
      detail: `Sentences average ${mean.toFixed(0)} words with very little variation (σ=${variance.toFixed(1)}). Human writing varies more.`,
      weight: w,
    });
  } else if (variance < 6 && lengths.length >= 4) {
    const w = 12;
    score += w;
    signals.push({
      label: "Low rhythm variation",
      detail: `Sentence lengths cluster tightly (σ=${variance.toFixed(1)}).`,
      weight: w,
    });
  }

  if (tellCount > 0) {
    const w = Math.min(30, tellCount * 7);
    score += w;
    signals.push({
      label: "Generated-text vocabulary",
      detail: `${tellCount} phrase${tellCount === 1 ? "" : "s"} such as "delve into" or "plays a crucial role in".`,
      weight: w,
    });
  }

  if (hedgeDensity > 1.8) {
    const w = Math.min(18, Math.round(hedgeDensity * 5));
    score += w;
    signals.push({
      label: "Stacked hedging",
      detail: `Hedge words make up ${hedgeDensity.toFixed(1)}% of the text.`,
      weight: w,
    });
  }

  if (transitionDensity > 22) {
    const w = 14;
    score += w;
    signals.push({
      label: "Formulaic connectives",
      detail: `${transitionDensity.toFixed(0)}% of sentences open with "Furthermore", "Moreover" or similar.`,
      weight: w,
    });
  }

  if (mean > 24) {
    const w = 10;
    score += w;
    signals.push({
      label: "Consistently long sentences",
      detail: `Average sentence runs to ${mean.toFixed(0)} words.`,
      weight: w,
    });
  }

  if (uniqueWordRatio > 0.78 && wordCount > 120) {
    const w = 8;
    score += w;
    signals.push({
      label: "Unusually even vocabulary",
      detail: "Almost no term is repeated, which is rare in focused academic argument.",
      weight: w,
    });
  }

  if (signals.length === 0) {
    signals.push({
      label: "Reads as human-written",
      detail: "Varied rhythm, no formulaic vocabulary clusters.",
      weight: 0,
    });
  }

  return {
    score: Math.min(100, Math.round(score)),
    signals,
    metrics: {
      sentenceLengthVariance: Number(variance.toFixed(2)),
      averageSentenceLength: Number(mean.toFixed(1)),
      tellPhraseCount: tellCount,
      hedgeDensity: Number(hedgeDensity.toFixed(2)),
      transitionDensity: Number(transitionDensity.toFixed(1)),
      uniqueWordRatio: Number(uniqueWordRatio.toFixed(3)),
    },
  };
}

// ── Rewriting ───────────────────────────────────────────────────────────────

export type HumanizeOptions = {
  /** Replace generated-text vocabulary. */
  simplifyVocabulary: boolean;
  /** Vary connectives so paragraphs stop opening the same way. */
  varyTransitions: boolean;
  /** Turn buried nouns back into verbs. */
  activateVerbs: boolean;
  /** Split over-long sentences and merge very short ones. */
  varyRhythm: boolean;
  /** Strip stacked hedges. */
  trimHedging: boolean;
};

export const DEFAULT_OPTIONS: HumanizeOptions = {
  simplifyVocabulary: true,
  varyTransitions: true,
  activateVerbs: true,
  varyRhythm: true,
  trimHedging: true,
};

export function humanize(
  input: string,
  options: HumanizeOptions = DEFAULT_OPTIONS,
): HumanizeResult {
  const before = detectAiStyle(input);
  const changes: HumanizeChange[] = [];
  let text = input;

  const swap = (
    pattern: RegExp,
    replacement: string,
    kind: HumanizeChange["kind"],
    reason: string,
  ) => {
    text = text.replace(pattern, (match) => {
      const value = applyCase(match, replacement);
      changes.push({ kind, before: match.trim(), after: value.trim() || "(removed)", reason });
      return value;
    });
  };

  if (options.simplifyVocabulary) {
    for (const [pattern, replacement] of TELL_PHRASES) {
      // The "underscores the importance of" entry carries a regex artefact.
      const clean = replacement.replace(" .* matters", " it matters");
      swap(pattern, clean, "PHRASE", "Reads as generated-text vocabulary.");
    }
  }

  if (options.activateVerbs) {
    for (const [pattern, replacement] of NOMINALISATIONS) {
      swap(pattern, replacement, "NOMINALISATION", "The verb was buried inside a noun phrase.");
    }
  }

  if (options.varyTransitions) {
    // Track what has already been used across every pattern. A plain rotating
    // counter is not enough: several patterns share "In addition, " as their
    // first alternative, so "Furthermore/Moreover/Additionally" would collapse
    // back into the same word. Picking the first *unused* option guarantees
    // variety while staying deterministic.
    const used = new Set<string>();
    let rotation = 0;
    for (const [pattern, alternatives] of TRANSITION_SWAPS) {
      text = text.replace(pattern, (match) => {
        const fresh = alternatives.find((a) => !used.has(a.trim()));
        const replacement = fresh ?? alternatives[rotation % alternatives.length];
        used.add(replacement.trim());
        rotation++;
        changes.push({
          kind: "TRANSITION",
          before: match.trim(),
          after: replacement.trim(),
          reason: "Formulaic connective; varied to break the pattern.",
        });
        return replacement;
      });
    }
  }

  if (options.trimHedging) {
    // Only strip a hedge when two or more sit in the same sentence.
    text = text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => {
        const found = HEDGES.filter((h) =>
          new RegExp(`\\b${h}\\b`, "i").test(sentence),
        );
        if (found.length < 2) return sentence;
        let output = sentence;
        for (const hedge of found.slice(1)) {
          const pattern = new RegExp(`\\s*\\b${hedge}\\b,?\\s*`, "i");
          if (pattern.test(output)) {
            output = output.replace(pattern, " ");
            changes.push({
              kind: "HEDGE",
              before: hedge,
              after: "(removed)",
              reason: "Several hedges in one sentence weaken the claim.",
            });
          }
        }
        return output.replace(/\s{2,}/g, " ").trim();
      })
      .join(" ");
  }

  if (options.varyRhythm) {
    text = varySentenceRhythm(text, changes);
  }

  // Tidy the artefacts left by removals.
  text = text
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([.!?])\s*([a-z])/g, (_m, punct: string, letter: string) =>
      `${punct} ${letter.toUpperCase()}`,
    )
    .replace(/^\s*([a-z])/, (_m, letter: string) => letter.toUpperCase())
    .trim();

  return { text, changes, before, after: detectAiStyle(text) };
}

/**
 * Splits sentences that run long at a coordinating conjunction. Only splits
 * where a clean clause boundary exists, so meaning survives.
 */
function varySentenceRhythm(text: string, changes: HumanizeChange[]): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const output: string[] = [];

  for (const sentence of sentences) {
    const words = (sentence.match(/[A-Za-z0-9'-]+/g) ?? []).length;

    if (words > 32) {
      // Prefer a split at ", and" / ", but" / "; " past the midpoint.
      const splitMatch = [...sentence.matchAll(/,\s+(and|but|while|whereas|although)\s+/g)]
        .find((m) => m.index > sentence.length * 0.35 && m.index < sentence.length * 0.8);

      if (splitMatch) {
        const head = sentence.slice(0, splitMatch.index).trim().replace(/[,;]$/, "");
        const tailWord = splitMatch[1];
        const tail = sentence.slice(splitMatch.index + splitMatch[0].length).trim();
        const connector =
          tailWord === "and" ? "" :
          tailWord === "but" ? "But " :
          `${tailWord[0].toUpperCase()}${tailWord.slice(1)} `;
        const rebuilt = `${head}. ${connector}${tail.charAt(0).toUpperCase()}${tail.slice(1)}`;
        changes.push({
          kind: "RHYTHM",
          before: `${sentence.slice(0, 46)}…`,
          after: `Split into two sentences (${words} words)`,
          reason: "Long sentences flatten the rhythm and bury the main clause.",
        });
        output.push(rebuilt);
        continue;
      }
    }

    output.push(sentence);
  }

  return output.join(" ");
}

function applyCase(original: string, replacement: string): string {
  if (replacement.length === 0) return "";
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  const core = original.trim();
  const value =
    core[0] === core[0]?.toUpperCase()
      ? replacement[0].toUpperCase() + replacement.slice(1)
      : replacement;
  return `${leading}${value}${trailing}`;
}
