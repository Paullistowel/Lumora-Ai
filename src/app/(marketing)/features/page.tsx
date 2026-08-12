import Image from "next/image";
import {
  BarChart3, BookOpen, Bell, FileSearch, Layers, Lock, ScanSearch,
  Scale, ShieldCheck, Sparkles, SpellCheck, Users,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem, TiltCard } from "@/components/motion";
import { Badge, ButtonLink, Card, PageHeader, SectionHeading } from "@/components/ui";
import { RISK_BANDS } from "@/lib/risk";

export const metadata = {
  title: "Features",
  description:
    "Semantic plagiarism detection, writing feedback, peer review, rubrics, analytics and audit — the full platform, module by module.",
};

const PILLARS = [
  {
    id: "detection",
    icon: ScanSearch,
    eyebrow: "Module 5",
    title: "Semantic plagiarism detection",
    body: "Each paragraph is converted into a 384-dimension vector with all-MiniLM-L6-v2, then compared by cosine similarity against every other submission for the same assignment. Because the comparison is on meaning, a rewritten paragraph still matches its source.",
    image: "/img/feature-embeddings.svg",
    points: [
      "Paragraph-level matching, not whole-document scores",
      "Length-weighted roll-up, so a matched body paragraph counts more than a heading",
      "Corpus scoped per assignment, so shared prompts don't register as misconduct",
      "Confidence reported separately — a 0% score with no corpus is not a clean bill",
    ],
  },
  {
    id: "writing",
    icon: SpellCheck,
    eyebrow: "Module 6",
    title: "Writing assistant",
    body: "Flesch reading ease and Flesch–Kincaid grade level, plus targeted checks on academic tone, passive voice, wordiness, sentence structure, citation density against claim density, transitions and lexical variety.",
    image: "/img/feature-grammar.svg",
    points: [
      "Deterministic, so improvement is comparable across semesters",
      "Every issue carries a rewrite suggestion, not just a label",
      "Flags claims that need a citation and don't have one",
      "Runs locally — no API key, no per-request cost",
    ],
  },
  {
    id: "humanizer",
    icon: Sparkles,
    eyebrow: "New",
    title: "AI-style detection & humanizing",
    body: "Scores the signals that correlate with generated prose — uniform sentence length, stock phrasing, stacked hedging, formulaic connectives — then rewrites them. Reported as a writing-quality signal, never as an accusation of authorship.",
    image: "/img/feature-humanizer.svg",
    points: [
      "Six weighted signals, each explained in plain language",
      "Selective rewriting: choose which patterns to change",
      "Before/after scoring so you can see what moved",
      "States plainly that it is not a way around disclosure rules",
    ],
  },
  {
    id: "peer-review",
    icon: Users,
    eyebrow: "Modules 7–9",
    title: "Peer review with quality scoring",
    body: "A rotating-offset allocation guarantees every submission gets the same number of reviews and every student writes the same number — which a random draw does not. Each review is then scored on depth, specificity, constructiveness and respectfulness.",
    image: "/img/feature-peer-review.svg",
    points: [
      "Double-blind by default; the reviewer never sees the author",
      "Rubric-driven scoring with per-criterion comments",
      "Hostile or low-effort reviews flagged for the lecturer",
      "Reviewers see how their own feedback was assessed",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    eyebrow: "Modules 10–12, 15",
    title: "Dashboards & analytics",
    body: "Students see their own trend. Lecturers see the cohort, who is at risk and what still needs marking. Administrators see an Academic Integrity Index they can take to a board.",
    image: "/img/feature-analytics.svg",
    points: [
      "Risk distribution across the five bands",
      "Students at risk against each assignment's own threshold",
      "Department comparison and integrity index",
      "Submission, similarity and writing-improvement trends",
    ],
  },
] as const;

const SUPPORTING = [
  { icon: Layers, title: "Assignment management", body: "Deadlines, late-submission policy, version control, per-assignment similarity thresholds and submission locking." },
  { icon: FileSearch, title: "Document processing", body: "PDF, DOCX, TXT and Markdown. Text extraction, de-hyphenation, paragraph detection and sentence tokenisation." },
  { icon: Scale, title: "Rubrics", body: "Weighted criteria, reusable department templates, and the same rubric driving both peer review and lecturer marking." },
  { icon: Bell, title: "Notifications", body: "In-app alerts for submissions, reports, review assignments, feedback and deadlines. SMTP transport plugs in." },
  { icon: ShieldCheck, title: "Audit & security", body: "Bcrypt passwords, revocable server-side sessions, OTP verification, and an immutable log of every meaningful action." },
  { icon: BookOpen, title: "Integrity knowledge base", body: "What plagiarism actually is, how scores are produced, and worked examples in APA, IEEE, Harvard and MLA." },
] as const;

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Platform"
        title="Every module, and what it actually does"
        description="Twenty modules across detection, feedback, review, analytics and administration. Below is what each one does and the reasoning behind how it works."
      />

      {/* Pillars */}
      <div className="space-y-20">
        {PILLARS.map((pillar, i) => (
          <Reveal key={pillar.id}>
            <section id={pillar.id} className="scroll-mt-28">
              <div
                className={`grid items-center gap-10 lg:grid-cols-2 ${
                  i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <Badge tone="brand">{pillar.eyebrow}</Badge>
                  <h2 className="mt-4 flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <pillar.icon className="size-5" />
                    </span>
                    {pillar.title}
                  </h2>
                  <p className="mt-4 text-pretty text-muted">{pillar.body}</p>
                  <ul className="mt-6 space-y-2.5">
                    {pillar.points.map((point) => (
                      <li key={point} className="flex gap-3 text-sm">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                        <span className="text-muted">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <TiltCard intensity={6}>
                  <Card className="overflow-hidden bg-surface-muted/40 p-3">
                    <Image
                      src={pillar.image}
                      alt=""
                      width={480}
                      height={400}
                      className="w-full rounded-xl"
                    />
                  </Card>
                </TiltCard>
              </div>
            </section>
          </Reveal>
        ))}
      </div>

      {/* Risk bands */}
      <Reveal>
        <section className="mt-24">
          <SectionHeading
            eyebrow="Scoring"
            title="Five risk bands, configurable per assignment"
            description="A band is a prompt to look, not a verdict. Lecturers set the threshold at which a submission is flagged on their dashboard."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {RISK_BANDS.map((band, i) => (
              <Reveal key={band.level} delay={i * 0.06}>
                <Card className="text-center">
                  <span
                    className="mx-auto mb-3 block size-3 rounded-full"
                    style={{ background: band.color }}
                  />
                  <p className="font-semibold">{band.label}</p>
                  <p className="mt-1 text-sm tabular-nums text-muted">
                    {band.min}–{band.max}%
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Supporting modules */}
      <Reveal>
        <section className="mt-24">
          <SectionHeading
            eyebrow="Also included"
            title="The unglamorous parts that make it usable"
          />
          <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SUPPORTING.map((item) => (
              <StaggerItem key={item.title}>
                <Card interactive className="h-full">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <item.icon className="size-4.5" />
                  </span>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{item.body}</p>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Reveal>

      {/* On-premise */}
      <Reveal>
        <section className="mt-24">
          <Card className="flex flex-col items-center gap-6 p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Lock className="size-6" />
            </span>
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight">
                Runs entirely on your own infrastructure
              </h2>
              <p className="mt-3 text-muted">
                The embedding model runs locally, submissions are stored on your
                own object storage, and there is no outbound call to a third-party
                scoring service. Student work never leaves your network.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/register" variant="gradient" className="px-6 py-3">
                Get started free
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary" className="px-6 py-3">
                Ask about deployment
              </ButtonLink>
            </div>
          </Card>
        </section>
      </Reveal>
    </div>
  );
}
