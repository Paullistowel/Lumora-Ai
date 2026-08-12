import { Reveal } from "@/components/motion";
import { Badge, Card, PageHeader } from "@/components/ui";
import { NewsletterForm } from "@/components/marketing/newsletter";

export const metadata = {
  title: "Changelog · AI-AIMS",
  description: "What shipped, when, and what it changed.",
};

type Entry = {
  version: string;
  date: string;
  title: string;
  tag: "Feature" | "Improvement" | "Fix";
  body: string;
  items: string[];
};

const ENTRIES: Entry[] = [
  {
    version: "0.4",
    date: "19 July 2026",
    title: "Free writing tools and a public site",
    tag: "Feature",
    body: "Three browser-only tools that need no account, plus a redesigned public site around them.",
    items: [
      "Grammar checker with live underlining, one-click fixes and category filtering",
      "Plagiarism checker comparing a draft against sources you supply",
      "AI-style detector and humanizer with before/after scoring",
      "Cookie consent giving equal weight to rejecting",
      "Newsletter sign-up and contact form",
    ],
  },
  {
    version: "0.3",
    date: "12 July 2026",
    title: "Peer review and review quality scoring",
    tag: "Feature",
    body: "Double-blind review with balanced allocation, and an automated assessment of whether each review is actually useful.",
    items: [
      "Rotating-offset allocation guarantees equal reviews per student",
      "Rubric-driven scoring with per-criterion comments",
      "Review quality scored on depth, specificity, constructiveness and tone",
      "Hostile and low-effort reviews flagged to the lecturer",
    ],
  },
  {
    version: "0.2",
    date: "5 July 2026",
    title: "Writing feedback",
    tag: "Feature",
    body: "Readability and style analysis running locally alongside the similarity engine.",
    items: [
      "Flesch reading ease and Flesch–Kincaid grade level",
      "Academic tone, passive voice, wordiness and transition checks",
      "Citation density measured against claim density",
      "Deterministic scoring so improvement is comparable across terms",
    ],
  },
  {
    version: "0.1",
    date: "28 June 2026",
    title: "Semantic plagiarism detection",
    tag: "Feature",
    body: "The core engine: paragraph embeddings compared by meaning rather than by string.",
    items: [
      "all-MiniLM-L6-v2 running locally through transformers.js",
      "Paragraph-level matching with length-weighted roll-up",
      "Five risk bands, configurable per assignment",
      "Confidence reported separately from score",
      "Lexical fallback so the pipeline still runs offline",
    ],
  },
];

const TAG_TONE = {
  Feature: "brand",
  Improvement: "accent",
  Fix: "success",
} as const;

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Changelog"
        title="What shipped, and when"
        description="Every release in reverse order. Roadmap items are not listed here until they actually work."
      />

      <ol className="relative space-y-6 border-l border-border pl-8">
        {ENTRIES.map((entry, i) => (
          <Reveal key={entry.version} delay={i * 0.07}>
            <li className="relative">
              <span className="absolute top-6 -left-[2.3rem] flex size-4 items-center justify-center rounded-full border-2 border-brand bg-background">
                <span className="size-1.5 rounded-full bg-brand" />
              </span>

              <Card>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge tone={TAG_TONE[entry.tag]}>{entry.tag}</Badge>
                  <span className="font-mono text-xs text-muted">v{entry.version}</span>
                  <span className="text-xs text-muted">· {entry.date}</span>
                </div>

                <h2 className="text-lg font-semibold">{entry.title}</h2>
                <p className="mt-1.5 text-sm text-muted">{entry.body}</p>

                <ul className="mt-4 space-y-1.5">
                  {entry.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-muted">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          </Reveal>
        ))}
      </ol>

      <Reveal>
        <Card className="mt-12 p-8">
          <h2 className="text-lg font-semibold">Get releases by email</h2>
          <p className="mt-1.5 mb-5 text-sm text-muted">
            The monthly brief includes the changelog plus what we learned
            building it.
          </p>
          <NewsletterForm source="changelog" variant="panel" />
        </Card>
      </Reveal>
    </div>
  );
}
