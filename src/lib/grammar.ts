/**
 * Rule-based grammar, spelling and style checker.
 *
 * Returns character offsets so the UI can underline the exact span and offer a
 * one-click replacement, the way Grammarly does. Everything runs locally and
 * deterministically — no API call, no text leaving the machine, which matters
 * for unpublished student work.
 *
 * Rules are intentionally conservative: a false positive on a student's essay
 * costs more trust than a missed comma costs accuracy. Where a rule cannot be
 * certain, it is scoped tightly or omitted.
 */

export type GrammarCategory =
  | "SPELLING"
  | "GRAMMAR"
  | "PUNCTUATION"
  | "CONFUSED_WORDS"
  | "STYLE"
  | "CLARITY"
  | "FORMALITY";

export type GrammarSeverity = "ERROR" | "WARNING" | "SUGGESTION";

export type GrammarIssue = {
  id: string;
  category: GrammarCategory;
  severity: GrammarSeverity;
  /** Inclusive start offset into the original text. */
  start: number;
  /** Exclusive end offset. */
  end: number;
  /** The exact text being flagged. */
  match: string;
  /** Short title, e.g. "Confused word". */
  title: string;
  /** Plain-language explanation of the problem. */
  message: string;
  /** Ordered replacement candidates; first is the recommended fix. */
  replacements: string[];
};

export type GrammarReport = {
  issues: GrammarIssue[];
  stats: {
    words: number;
    sentences: number;
    paragraphs: number;
    characters: number;
    readingTimeMinutes: number;
    readabilityScore: number;
    gradeLevel: number;
    /** 0–100, weighted by issue density and severity. */
    correctnessScore: number;
  };
  countsByCategory: Record<GrammarCategory, number>;
};

export const CATEGORY_LABEL: Record<GrammarCategory, string> = {
  SPELLING: "Spelling",
  GRAMMAR: "Grammar",
  PUNCTUATION: "Punctuation",
  CONFUSED_WORDS: "Confused words",
  STYLE: "Style",
  CLARITY: "Clarity",
  FORMALITY: "Formality",
};

// ── Rule tables ─────────────────────────────────────────────────────────────

/** Misspellings common in student writing. Deliberately unambiguous entries. */
const MISSPELLINGS: Record<string, string> = {
  recieve: "receive", recieved: "received", recieving: "receiving",
  seperate: "separate", seperated: "separated", seperately: "separately",
  definately: "definitely", occured: "occurred", occuring: "occurring",
  neccessary: "necessary", necessery: "necessary", accomodate: "accommodate",
  begining: "beginning", beleive: "believe", beleived: "believed",
  calender: "calendar", concious: "conscious", enviroment: "environment",
  existance: "existence", goverment: "government", grammer: "grammar",
  independant: "independent", knowlege: "knowledge", maintainance: "maintenance",
  occassion: "occasion", persistant: "persistent", posession: "possession",
  publically: "publicly", questionaire: "questionnaire", refered: "referred",
  relevent: "relevant", responsable: "responsible", succesful: "successful",
  successfull: "successful", tendancy: "tendency", threshhold: "threshold",
  untill: "until", wich: "which", wierd: "weird", writting: "writing",
  arguement: "argument", basicly: "basically", commited: "committed",
  compair: "compare", critisism: "criticism", curriculem: "curriculum",
  developement: "development", dilemna: "dilemma", embarass: "embarrass",
  experiance: "experience", familier: "familiar", futher: "further",
  hierachy: "hierarchy", imediately: "immediately", inteligence: "intelligence",
  liason: "liaison", millenium: "millennium", noticable: "noticeable",
  paralell: "parallel", perseverence: "perseverance", priviledge: "privilege",
  reccomend: "recommend", refrence: "reference", rythm: "rhythm",
  significent: "significant", similiar: "similar", sucessfully: "successfully",
  supress: "suppress", thier: "their", tommorow: "tomorrow", truely: "truly",
  unfortunatly: "unfortunately", usefull: "useful", vaccum: "vacuum",
  wheras: "whereas", analize: "analyse", analisys: "analysis",
  hypothesise: "hypothesise", occurence: "occurrence", reasearch: "research",
  litrature: "literature", methodolgy: "methodology", questionnair: "questionnaire",
  conclussion: "conclusion", intrest: "interest", becuase: "because",
  becasue: "because", teh: "the", adn: "and", taht: "that", thsi: "this",
  fro: "for", ot: "to", nad: "and",
};

/** Word pairs students routinely swap, each with a disambiguating pattern. */
type ConfusionRule = {
  pattern: RegExp;
  wrong: string;
  right: string;
  message: string;
};

const CONFUSIONS: ConfusionRule[] = [
  {
    pattern: /\bthere\s+(?=(?:own|research|study|findings|results|argument|data|paper|work|approach)\b)/gi,
    wrong: "there", right: "their",
    message: '"Their" is the possessive. "There" refers to a place.',
  },
  {
    pattern: /\btheir\s+(?=(?:is|are|was|were)\b)/gi,
    wrong: "their", right: "there",
    message: '"There is/are" introduces existence. "Their" shows possession.',
  },
  {
    pattern: /\bits\s+(?=(?:a|an|the|been|not|clear|important|possible|likely|often)\b)/gi,
    wrong: "its", right: "it's",
    message: '"It\'s" is the contraction of "it is". "Its" is possessive.',
  },
  {
    pattern: /\bit's\s+(?=(?:own|impact|effect|purpose|role|value|significance|use|scope|limitations?)\b)/gi,
    wrong: "it's", right: "its",
    message: '"Its" is the possessive form. "It\'s" means "it is".',
  },
  {
    pattern: /\byour\s+(?=(?:welcome|right|wrong|correct|going|able)\b)/gi,
    wrong: "your", right: "you're",
    message: '"You\'re" is the contraction of "you are".',
  },
  {
    pattern: /\bthen\s+(?=(?:the\s+\w+er\b|more|less|other|any)\b)/gi,
    wrong: "then", right: "than",
    message: '"Than" is for comparison. "Then" is for sequence.',
  },
  {
    pattern: /\ba\s+effect\b/gi,
    wrong: "a effect", right: "an effect",
    message: 'Use "an" before a vowel sound.',
  },
  {
    pattern: /\beffect\s+(?=(?:the|this|these|those|student|learning|outcome)\w*\s)/gi,
    wrong: "effect", right: "affect",
    message: '"Affect" is usually the verb; "effect" is usually the noun.',
  },
  {
    pattern: /\bcould\s+of\b/gi,
    wrong: "could of", right: "could have",
    message: '"Could have", not "could of".',
  },
  {
    pattern: /\bwould\s+of\b/gi,
    wrong: "would of", right: "would have",
    message: '"Would have", not "would of".',
  },
  {
    pattern: /\bshould\s+of\b/gi,
    wrong: "should of", right: "should have",
    message: '"Should have", not "should of".',
  },
  {
    pattern: /\bloose\s+(?=(?:the|their|its|his|her|our)\b)/gi,
    wrong: "loose", right: "lose",
    message: '"Lose" is the verb. "Loose" means not tight.',
  },
  {
    pattern: /\bcite\s+(?=(?:of\s+the\s+study|selection|visit)\b)/gi,
    wrong: "cite", right: "site",
    message: '"Site" is a location; "cite" is to reference.',
  },
  {
    pattern: /\bprincipal\s+(?=(?:reason|finding|argument|aim|objective|component)\b)/gi,
    wrong: "principal", right: "principal",
    message: 'Check: "principal" means chief; "principle" means a rule or belief.',
  },
  {
    pattern: /\bcomplimentary\s+(?=(?:approach|method|technique|analysis|data)\b)/gi,
    wrong: "complimentary", right: "complementary",
    message: '"Complementary" means completing; "complimentary" means praising or free.',
  },
];

/** Wordy constructions with a tighter equivalent. */
const WORDY: [RegExp, string][] = [
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bowing to the fact that\b/gi, "because"],
  [/\bat this point in time\b/gi, "now"],
  [/\bat the present time\b/gi, "currently"],
  [/\bin the event that\b/gi, "if"],
  [/\bfor the purpose of\b/gi, "for"],
  [/\bin spite of the fact that\b/gi, "although"],
  [/\bwith regard to\b/gi, "about"],
  [/\bin relation to\b/gi, "about"],
  [/\ba large number of\b/gi, "many"],
  [/\ba small number of\b/gi, "few"],
  [/\bthe majority of\b/gi, "most"],
  [/\bis able to\b/gi, "can"],
  [/\bhas the ability to\b/gi, "can"],
  [/\bmake a decision\b/gi, "decide"],
  [/\bcarry out an analysis of\b/gi, "analyse"],
  [/\bconduct an investigation into\b/gi, "investigate"],
  [/\bit is important to note that\b/gi, ""],
  [/\bit should be noted that\b/gi, ""],
  [/\bneedless to say,?\s*/gi, ""],
  [/\bin my personal opinion\b/gi, "in my view"],
  [/\bcompletely eliminate\b/gi, "eliminate"],
  [/\babsolutely essential\b/gi, "essential"],
  [/\bend result\b/gi, "result"],
  [/\bfuture plans\b/gi, "plans"],
  [/\bpast history\b/gi, "history"],
  [/\beach and every\b/gi, "every"],
  [/\bfirst and foremost\b/gi, "first"],
];

/** Informal words with an academic replacement. */
const INFORMAL: [RegExp, string][] = [
  [/\ba lot of\b/gi, "many"],
  [/\blots of\b/gi, "many"],
  [/\bkind of\b/gi, "somewhat"],
  [/\bsort of\b/gi, "somewhat"],
  [/\bstuff\b/gi, "material"],
  [/\bthings\b/gi, "factors"],
  [/\bhuge\b/gi, "substantial"],
  [/\bbig\b/gi, "significant"],
  [/\bgot\b/gi, "obtained"],
  [/\bnowadays\b/gi, "currently"],
  [/\bkids\b/gi, "children"],
  [/\bok\b/gi, "acceptable"],
  [/\bokay\b/gi, "acceptable"],
  [/\bpretty much\b/gi, "largely"],
  [/\bbasically\b/gi, ""],
  [/\btotally\b/gi, "entirely"],
  [/\bsuper\b/gi, "highly"],
  [/\bawesome\b/gi, "notable"],
];

const CONTRACTIONS: Record<string, string> = {
  "can't": "cannot", "won't": "will not", "don't": "do not",
  "doesn't": "does not", "didn't": "did not", "isn't": "is not",
  "aren't": "are not", "wasn't": "was not", "weren't": "were not",
  "couldn't": "could not", "shouldn't": "should not", "wouldn't": "would not",
  "hasn't": "has not", "haven't": "have not", "hadn't": "had not",
  "it's": "it is", "that's": "that is", "there's": "there is",
  "they're": "they are", "we're": "we are", "you're": "you are",
  "i'm": "I am", "let's": "let us", "who's": "who is", "what's": "what is",
};

// ── Engine ──────────────────────────────────────────────────────────────────

let counter = 0;
function nextId() {
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  return `g${counter}`;
}

/** Character ranges that must never be flagged: quotations and citations. */
function protectedRanges(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  const patterns = [
    /"[^"]{0,600}"/g, // direct quotations
    /\([A-Z][^)]{0,80}\d{4}[^)]{0,20}\)/g, // (Author, 2021)
    /\[\d{1,3}(?:[-,]\s?\d{1,3})*\]/g, // [1], [2-4]
    /https?:\/\/\S+/g,
    /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      ranges.push([match.index, match.index + match[0].length]);
    }
  }
  return ranges;
}

function isProtected(ranges: [number, number][], start: number, end: number) {
  return ranges.some(([a, b]) => start >= a && end <= b);
}

export function checkGrammar(text: string): GrammarReport {
  const issues: GrammarIssue[] = [];
  const safe = protectedRanges(text);

  const push = (issue: Omit<GrammarIssue, "id">) => {
    if (isProtected(safe, issue.start, issue.end)) return;
    // One flag per span — the highest-priority rule wins.
    if (issues.some((existing) => existing.start === issue.start)) return;
    issues.push({ ...issue, id: nextId() });
  };

  // 1 — Spelling
  for (const match of text.matchAll(/\b[A-Za-z']+\b/g)) {
    const word = match[0];
    const correction = MISSPELLINGS[word.toLowerCase()];
    if (!correction) continue;
    push({
      category: "SPELLING",
      severity: "ERROR",
      start: match.index,
      end: match.index + word.length,
      match: word,
      title: "Spelling",
      message: `"${word}" is misspelled.`,
      replacements: [matchCase(word, correction)],
    });
  }

  // 2 — Confused words
  for (const rule of CONFUSIONS) {
    for (const match of text.matchAll(rule.pattern)) {
      const raw = match[0].trimEnd();
      if (raw.toLowerCase() === rule.right.toLowerCase()) continue;
      push({
        category: "CONFUSED_WORDS",
        severity: "ERROR",
        start: match.index,
        end: match.index + raw.length,
        match: raw,
        title: "Commonly confused word",
        message: rule.message,
        replacements: [matchCase(raw, rule.right)],
      });
    }
  }

  // 3 — Repeated word ("the the")
  for (const match of text.matchAll(/\b(\w+)\s+\1\b/gi)) {
    // "had had" and "that that" are valid English.
    if (/^(had|that|is|very)$/i.test(match[1])) continue;
    push({
      category: "GRAMMAR",
      severity: "ERROR",
      start: match.index,
      end: match.index + match[0].length,
      match: match[0],
      title: "Repeated word",
      message: `"${match[1]}" appears twice in a row.`,
      replacements: [match[1]],
    });
  }

  // 4 — a/an before a vowel sound
  for (const match of text.matchAll(/\ba\s+(?=[aeiou])(\w+)/gi)) {
    // "a university", "a one-off", "a European" all take "a".
    if (/^(uni|use|user|usual|utili|one|euro|ubiqu)/i.test(match[1])) continue;
    const article = match[0].slice(0, 1);
    push({
      category: "GRAMMAR",
      severity: "ERROR",
      start: match.index,
      end: match.index + 1,
      match: article,
      title: "Article agreement",
      message: `Use "an" before the vowel sound in "${match[1]}".`,
      replacements: [article === "A" ? "An" : "an"],
    });
  }
  for (const match of text.matchAll(/\ban\s+(?=[bcdfgjklmnpqrstvwxyz])(\w+)/gi)) {
    if (/^(hour|honest|honour|honor|heir)/i.test(match[1])) continue;
    const article = match[0].slice(0, 2);
    push({
      category: "GRAMMAR",
      severity: "ERROR",
      start: match.index,
      end: match.index + 2,
      match: article,
      title: "Article agreement",
      message: `Use "a" before the consonant sound in "${match[1]}".`,
      replacements: [article === "An" ? "A" : "a"],
    });
  }

  // 5 — Subject–verb agreement, restricted to unambiguous pronoun pairs
  for (const match of text.matchAll(
    /\b(he|she|it|they|we|you|I)\s+(is|are|was|were|has|have|does|do)\b/gi,
  )) {
    const subject = match[1].toLowerCase();
    const verb = match[2].toLowerCase();
    const singular = ["he", "she", "it"].includes(subject);
    const correct: Record<string, [string, string]> = {
      // verb -> [singular form, plural form]
      is: ["is", "are"], are: ["is", "are"],
      was: ["was", "were"], were: ["was", "were"],
      has: ["has", "have"], have: ["has", "have"],
      does: ["does", "do"], do: ["does", "do"],
    };
    const [sing, plur] = correct[verb];
    const expected = singular ? sing : plur;
    // "I" takes plural forms except for "was" and "am".
    if (subject === "i" && (verb === "was" || verb === "have" || verb === "do")) continue;
    if (verb === expected) continue;
    const verbStart = match.index + match[1].length + 1;
    push({
      category: "GRAMMAR",
      severity: "ERROR",
      start: verbStart,
      end: verbStart + match[2].length,
      match: match[2],
      title: "Subject–verb agreement",
      message: `"${match[1]}" takes "${expected}".`,
      replacements: [matchCase(match[2], expected)],
    });
  }

  // 6 — Double space and space before punctuation
  for (const match of text.matchAll(/\S(  +)\S/g)) {
    const start = match.index + 1;
    push({
      category: "PUNCTUATION",
      severity: "WARNING",
      start,
      end: start + match[1].length,
      match: match[1],
      title: "Extra spacing",
      message: "Use a single space between words.",
      replacements: [" "],
    });
  }
  for (const match of text.matchAll(/\s+([,.;:!?])/g)) {
    push({
      category: "PUNCTUATION",
      severity: "WARNING",
      start: match.index,
      end: match.index + match[0].length,
      match: match[0],
      title: "Spacing before punctuation",
      message: "Punctuation attaches to the preceding word.",
      replacements: [match[1]],
    });
  }
  for (const match of text.matchAll(/([,;:])(?=[A-Za-z])/g)) {
    push({
      category: "PUNCTUATION",
      severity: "WARNING",
      start: match.index,
      end: match.index + 1,
      match: match[1],
      title: "Missing space",
      message: "Add a space after the punctuation mark.",
      replacements: [`${match[1]} `],
    });
  }

  // 7 — Sentence not capitalised
  for (const match of text.matchAll(/(?:^|[.!?]\s+)([a-z])/g)) {
    const offset = match.index + match[0].length - 1;
    push({
      category: "GRAMMAR",
      severity: "ERROR",
      start: offset,
      end: offset + 1,
      match: match[1],
      title: "Capitalisation",
      message: "Sentences begin with a capital letter.",
      replacements: [match[1].toUpperCase()],
    });
  }

  // 8 — Standalone "i"
  for (const match of text.matchAll(/\bi\b/g)) {
    push({
      category: "GRAMMAR",
      severity: "ERROR",
      start: match.index,
      end: match.index + 1,
      match: "i",
      title: "Capitalisation",
      message: 'The pronoun "I" is always capitalised.',
      replacements: ["I"],
    });
  }

  // 9 — Missing comma after an introductory adverbial
  for (const match of text.matchAll(
    /(?:^|[.!?]\s+)(However|Therefore|Moreover|Furthermore|Nevertheless|Consequently|Additionally|Similarly|Conversely|Meanwhile|Instead|Overall|Finally|Subsequently)\s+(?=[a-z])/g,
  )) {
    const wordStart = match.index + match[0].indexOf(match[1]);
    const end = wordStart + match[1].length;
    push({
      category: "PUNCTUATION",
      severity: "WARNING",
      start: wordStart,
      end,
      match: match[1],
      title: "Missing comma",
      message: `Introductory adverbs such as "${match[1]}" take a comma.`,
      replacements: [`${match[1]},`],
    });
  }

  // 10 — Contractions (formality)
  for (const match of text.matchAll(
    /\b(can't|won't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|couldn't|shouldn't|wouldn't|hasn't|haven't|hadn't|it's|that's|there's|they're|we're|you're|i'm|let's|who's|what's)\b/gi,
  )) {
    const expansion = CONTRACTIONS[match[0].toLowerCase()];
    if (!expansion) continue;
    push({
      category: "FORMALITY",
      severity: "SUGGESTION",
      start: match.index,
      end: match.index + match[0].length,
      match: match[0],
      title: "Contraction",
      message: "Academic writing usually avoids contractions.",
      replacements: [matchCase(match[0], expansion)],
    });
  }

  // 11 — Wordiness
  for (const [pattern, replacement] of WORDY) {
    for (const match of text.matchAll(pattern)) {
      push({
        category: "CLARITY",
        severity: "SUGGESTION",
        start: match.index,
        end: match.index + match[0].length,
        match: match[0],
        title: "Wordy phrase",
        message: replacement
          ? `"${match[0]}" can be shortened without losing meaning.`
          : "This phrase adds length without adding meaning.",
        replacements: replacement ? [matchCase(match[0], replacement)] : ["(delete)"],
      });
    }
  }

  // 12 — Informal vocabulary
  for (const [pattern, replacement] of INFORMAL) {
    for (const match of text.matchAll(pattern)) {
      push({
        category: "FORMALITY",
        severity: "SUGGESTION",
        start: match.index,
        end: match.index + match[0].length,
        match: match[0],
        title: "Informal word",
        message: "Consider a more precise academic term.",
        replacements: replacement ? [matchCase(match[0], replacement)] : ["(delete)"],
      });
    }
  }

  // 13 — Passive voice
  for (const match of text.matchAll(
    /\b(?:is|are|was|were|been|being)\s+(?:\w+ly\s+)?(\w+(?:ed|en))\s+by\b/gi,
  )) {
    push({
      category: "STYLE",
      severity: "SUGGESTION",
      start: match.index,
      end: match.index + match[0].length,
      match: match[0],
      title: "Passive voice",
      message:
        "The actor appears after the verb. Active voice is usually more direct — keep passive where the method matters more than the researcher.",
      replacements: [],
    });
  }

  // 14 — Very long sentences
  let cursor = 0;
  for (const sentence of splitSentencesWithOffsets(text)) {
    cursor = sentence.start;
    const words = sentence.text.match(/[A-Za-z0-9'-]+/g)?.length ?? 0;
    if (words > 45) {
      push({
        category: "CLARITY",
        severity: "WARNING",
        start: sentence.start,
        end: Math.min(sentence.end, sentence.start + 90),
        match: sentence.text.slice(0, 90),
        title: "Very long sentence",
        message: `This sentence runs to ${words} words. Split it at the main clause boundary so each carries one idea.`,
        replacements: [],
      });
    }
  }
  void cursor;

  issues.sort((a, b) => a.start - b.start);

  // ── Statistics ────────────────────────────────────────────────────────────
  const words = text.match(/[A-Za-z0-9'-]+/g)?.length ?? 0;
  const sentences = splitSentencesWithOffsets(text).length;
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0).length;
  const syllables = countSyllables(text);

  const wordsPerSentence = words / Math.max(sentences, 1);
  const syllablesPerWord = syllables / Math.max(words, 1);
  const readabilityScore = words
    ? clamp(206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord, 0, 100)
    : 0;
  const gradeLevel = words
    ? Math.max(0, 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59)
    : 0;

  const weighted = issues.reduce(
    (total, issue) =>
      total +
      (issue.severity === "ERROR" ? 3 : issue.severity === "WARNING" ? 1.6 : 0.8),
    0,
  );
  // Density per 100 words, so a long essay isn't penalised for its length.
  const density = words > 0 ? (weighted / words) * 100 : 0;
  const correctnessScore = words < 5 ? 0 : Math.round(clamp(100 - density * 7, 0, 100));

  const countsByCategory = {
    SPELLING: 0, GRAMMAR: 0, PUNCTUATION: 0, CONFUSED_WORDS: 0,
    STYLE: 0, CLARITY: 0, FORMALITY: 0,
  } as Record<GrammarCategory, number>;
  for (const issue of issues) countsByCategory[issue.category]++;

  return {
    issues,
    stats: {
      words,
      sentences,
      paragraphs,
      characters: text.length,
      readingTimeMinutes: Math.max(1, Math.round(words / 225)),
      readabilityScore: round1(readabilityScore),
      gradeLevel: round1(gradeLevel),
      correctnessScore,
    },
    countsByCategory,
  };
}

/** Applies every issue's first replacement, right to left so offsets hold. */
export function applyAll(text: string, issues: GrammarIssue[]): string {
  const fixable = issues
    .filter((issue) => issue.replacements.length > 0 && issue.replacements[0] !== "(delete)")
    .sort((a, b) => b.start - a.start);

  let output = text;
  for (const issue of fixable) {
    output = output.slice(0, issue.start) + issue.replacements[0] + output.slice(issue.end);
  }
  return output;
}

export function applyOne(text: string, issue: GrammarIssue, replacement: string) {
  const value = replacement === "(delete)" ? "" : replacement;
  return text.slice(0, issue.start) + value + text.slice(issue.end);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function splitSentencesWithOffsets(text: string) {
  const result: { text: string; start: number; end: number }[] = [];
  const pattern = /[^.!?]+[.!?]*/g;
  for (const match of text.matchAll(pattern)) {
    const raw = match[0];
    const trimmedStart = raw.length - raw.trimStart().length;
    const value = raw.trim();
    if (value.length === 0) continue;
    result.push({
      text: value,
      start: match.index + trimmedStart,
      end: match.index + trimmedStart + value.length,
    });
  }
  return result;
}

/** Mirrors the capitalisation of the original onto the replacement. */
function matchCase(original: string, replacement: string): string {
  if (original === original.toUpperCase() && original.length > 1) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0]?.toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function countSyllables(text: string): number {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  return words.reduce((total, word) => {
    if (word.length <= 3) return total + 1;
    const trimmed = word
      .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
      .replace(/^y/, "");
    return total + Math.max(1, (trimmed.match(/[aeiouy]{1,2}/g) ?? []).length);
  }, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}
