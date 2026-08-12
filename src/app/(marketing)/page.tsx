import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, BarChart3, BookOpen, Check, ClipboardPaste, Cpu, FileUp,
  GitCompare, Lock, MapPin, ScanSearch, ShieldCheck, Sparkles, SpellCheck,
  Users, WifiOff,
} from "lucide-react";
import {
  AnimatedHeading, Parallax, Reveal, Spotlight, Stagger, StaggerItem,
  TiltCard, Layer3D,
} from "@/components/motion";
import { MaturityBadge } from "@/components/brand";
import { NewsletterForm } from "@/components/marketing/newsletter";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";

export const metadata = {
  // Absolute: the landing page is the brand, so it must not take the
  // "%s · Lume AI" template and end up saying Lume AI twice.
  title: {
    absolute: "Lume AI — Illuminate your academic work with AI",
  },
  description:
    "Semantic plagiarism detection, academic writing analysis and structured peer review for higher education. A research prototype from Group 4, KNUST.",
};

const TRUST_STRIP = [
  { icon: ScanSearch, label: "Semantic AI" },
  { icon: ShieldCheck, label: "Academic integrity" },
  { icon: MapPin, label: "Ghanaian context" },
  { icon: Users, label: "Peer review" },
  { icon: Cpu, label: "Local processing" },
];

const CAPABILITIES = [
  {
    icon: ScanSearch,
    title: "Semantic similarity",
    body: "Every paragraph becomes a vector that encodes meaning rather than wording. A reworded passage still matches its source — the case a string-matching checker scores near zero.",
    image: "/img/feature-embeddings.svg",
    href: "/how-it-works",
    accent: "var(--brand)",
    status: "IMPLEMENTED" as const,
  },
  {
    icon: SpellCheck,
    title: "Academic writing",
    body: "Readability, academic tone, structure, coherence and grammar — each issue reported with what to change, not just a score against it.",
    image: "/img/feature-grammar.svg",
    href: "/features",
    accent: "var(--accent)",
    status: "IMPLEMENTED" as const,
  },
  {
    icon: Users,
    title: "Peer review",
    body: "Double-blind allocation balanced across the cohort, rubric-guided scoring, and an assessment of whether each review is specific, constructive and respectful.",
    image: "/img/feature-peer-review.svg",
    href: "/features#peer-review",
    accent: "var(--brand)",
    status: "IMPLEMENTED" as const,
  },
  {
    icon: ShieldCheck,
    title: "Integrity analysis",
    body: "Citation coverage across the document, and evidence-claims that carry no attribution — surfaced as prompts to check, never as an accusation.",
    image: "/img/feature-analytics.svg",
    href: "/integrity",
    accent: "var(--accent-2)",
    status: "IMPLEMENTED" as const,
  },
  {
    icon: Sparkles,
    title: "AI-style indicators",
    body: "Stylistic patterns associated with generated prose: uniform rhythm, stock phrasing, flattened vocabulary. Indicative only — it cannot establish authorship.",
    image: "/img/feature-humanizer.svg",
    href: "/tools/humanizer",
    accent: "var(--accent)",
    status: "EXPERIMENTAL" as const,
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-10 pb-24 sm:pt-16">
        <div className="aurora" aria-hidden />
        <div className="grid-lines" aria-hidden />
        <div className="noise" aria-hidden />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Reveal direction="none">
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 py-1.5 pr-3 pl-1.5 text-xs font-medium backdrop-blur">
                <span className="rounded-full bg-gradient-to-r from-brand to-accent px-2 py-0.5 text-[11px] text-white">
                  Research prototype
                </span>
                Group 4 · KNUST · 2026
              </span>
            </Reveal>

            <AnimatedHeading
              text="Illuminate your academic work with AI"
              className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
            />

            <Reveal delay={0.35}>
              <p className="mt-6 max-w-xl text-lg text-pretty text-muted">
                Semantic plagiarism detection, academic writing analysis and
                structured peer review for higher education. Lume AI compares{" "}
                <em>meaning</em>, so a rewritten paragraph still matches its
                source — and it explains every score instead of just issuing one.
              </p>
            </Reveal>

            <Reveal delay={0.45}>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/register" variant="gradient" className="px-6 py-3">
                  Explore Lume AI
                  <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink href="/research" variant="secondary" className="px-6 py-3">
                  View research
                </ButtonLink>
                <ButtonLink href="/tools/plagiarism" variant="ghost" className="px-6 py-3">
                  Analyse a document
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal delay={0.55}>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
                {[
                  "Runs on your own server",
                  "No cloud inference",
                  "Evidence with every score",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check className="size-4 text-risk-original" />
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.3} direction="left">
            <Parallax strength={26}>
              <TiltCard className="group" intensity={7}>
                <div className="glow-ring relative rounded-3xl">
                  <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-2 shadow-[var(--shadow-lg)]">
                    <Image
                      src="/img/hero-analysis.svg"
                      alt="A Lume AI analysis report: two academic passages side by side with the matching paragraphs highlighted and a paragraph-level similarity heatmap beneath them"
                      width={720}
                      height={560}
                      priority
                      className="w-full rounded-2xl"
                    />
                  </div>

                  <Layer3D
                    z={60}
                    className="pointer-events-none absolute -top-4 -left-4 hidden sm:block"
                  >
                    <div className="float rounded-2xl border border-border bg-surface px-3.5 py-2.5 shadow-[var(--shadow-lg)]">
                      <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">
                        Match type
                      </p>
                      <p className="text-sm font-semibold text-accent">Paraphrase</p>
                    </div>
                  </Layer3D>

                  <Layer3D
                    z={70}
                    className="pointer-events-none absolute -right-3 -bottom-5 hidden sm:block"
                  >
                    <div
                      className="float rounded-2xl border border-border bg-surface px-3.5 py-2.5 shadow-[var(--shadow-lg)]"
                      style={{ animationDelay: "1.4s" }}
                    >
                      <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">
                        Processed
                      </p>
                      <p className="text-sm font-semibold text-risk-original">
                        On this server
                      </p>
                    </div>
                  </Layer3D>
                </div>
              </TiltCard>
            </Parallax>
          </Reveal>
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface/50 py-8">
        <p className="mb-6 text-center text-xs font-medium tracking-[0.14em] text-muted uppercase">
          What Lume AI is built around
        </p>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4">
          {TRUST_STRIP.map((entry) => (
            <span
              key={entry.label}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted"
            >
              <entry.icon className="size-4 text-brand" />
              {entry.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Problem → approach ─────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <Reveal>
              <Card className="h-full border-risk-high/25">
                <Badge tone="danger">The problem</Badge>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  Word-matching stopped measuring what it claims to measure
                </h2>
                <div className="mt-4 space-y-3 text-muted">
                  <p>
                    Mainstream plagiarism tools compare sequences of characters. A
                    student who spends ten minutes rewording a source scores near
                    zero — and generative models turned those ten minutes into ten
                    seconds.
                  </p>
                  <p>
                    Meanwhile the students who <em>are</em> flagged are usually the
                    ones who cited badly rather than the ones who copied
                    deliberately, and the report they get back is a number with no
                    explanation attached to it.
                  </p>
                </div>
              </Card>
            </Reveal>

            <Reveal delay={0.1}>
              <Card className="h-full border-brand/25">
                <Badge tone="brand">The approach</Badge>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  Compare meaning, then explain the result
                </h2>
                <div className="mt-4 space-y-3 text-muted">
                  <p>
                    Sentence-transformer embeddings place a paragraph as a point in
                    semantic space. Two passages arguing the same thing land close
                    together whatever vocabulary they use.
                  </p>
                  <p>
                    Lume AI pairs that with the part detection alone never does: the
                    passage it matched, whether the overlap is copied or reworded,
                    what the writing itself needs, and a peer review process that
                    teaches students to read critically.
                  </p>
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Workspace ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="The workspace"
              title="Upload. Analyse. Understand."
              description="Students and lecturers get the same workspace. Analyse a draft before submitting it, a paper you are reviewing, or any academic document at all."
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div className="space-y-4">
                {[
                  {
                    icon: FileUp,
                    title: "Drop your academic document",
                    body: "PDF, DOCX, DOC, TXT or Markdown, up to 15MB.",
                  },
                  {
                    icon: ClipboardPaste,
                    title: "Or paste the text",
                    body: "For a draft that is not a file yet.",
                  },
                  {
                    icon: ScanSearch,
                    title: "Choose what to analyse",
                    body: "Similarity, writing, integrity, AI-style — or run everything.",
                  },
                  {
                    icon: BarChart3,
                    title: "Read the evidence",
                    body: "Heatmap, matched passages, and what to fix.",
                  },
                ].map((step, index) => (
                  <div key={step.title} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <step.icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-medium">
                        <span className="mr-2 font-mono text-xs text-muted">
                          0{index + 1}
                        </span>
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Spotlight className="rounded-3xl">
                <Card className="overflow-hidden">
                  <p className="mb-4 text-xs font-medium tracking-wide text-muted uppercase">
                    Product demonstration — illustrative layout, not a live result
                  </p>
                  <div className="rounded-2xl border-2 border-dashed border-border bg-surface-muted/50 px-6 py-8 text-center">
                    <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface text-brand">
                      <FileUp className="size-5" />
                    </span>
                    <p className="text-sm font-medium">
                      Drop your academic document here
                    </p>
                    <p className="mt-1 text-xs text-muted">PDF, DOCX, DOC or TXT</p>
                  </div>

                  <div className="my-4 flex justify-center text-muted" aria-hidden>
                    ↓
                  </div>

                  <div className="space-y-2">
                    {[
                      "Semantic similarity",
                      "Academic writing",
                      "Integrity checks",
                      "AI-style indicators",
                    ].map((row) => (
                      <div
                        key={row}
                        className="flex items-center justify-between rounded-xl border border-border bg-surface-muted/40 px-3.5 py-2.5 text-sm"
                      >
                        <span>{row}</span>
                        <Check className="size-4 text-risk-original" />
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-xs text-muted">
                    Real scores appear when you run this on a document of your own —
                    this panel deliberately shows no numbers.
                  </p>
                </Card>
              </Spotlight>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Capabilities ───────────────────────────────────────────────── */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="What it does"
              title="Five analyses that work as one platform"
              description="Detection tells you something happened. The rest is what changes whether it happens again."
            />
          </Reveal>

          <div className="mt-14 grid gap-5 lg:grid-cols-6">
            {CAPABILITIES.map((capability, i) => (
              <Reveal
                key={capability.title}
                delay={i * 0.07}
                className={i < 2 ? "lg:col-span-3" : "lg:col-span-2"}
              >
                <Link href={capability.href} className="focus-ring block h-full rounded-2xl">
                  <Spotlight className="h-full rounded-2xl">
                    <Card interactive className="flex h-full flex-col overflow-hidden">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <span
                          className="flex size-11 items-center justify-center rounded-xl"
                          style={{
                            background: `color-mix(in srgb, ${capability.accent} 14%, transparent)`,
                            color: capability.accent,
                          }}
                        >
                          <capability.icon className="size-5" />
                        </span>
                        <MaturityBadge status={capability.status} />
                      </div>

                      <h3 className="text-lg font-semibold">{capability.title}</h3>
                      <p className="mt-2 text-sm text-muted">{capability.body}</p>

                      <div className="mt-5 -mb-5 overflow-hidden rounded-t-xl border-x border-t border-border bg-surface-muted/60 pt-3">
                        <Image
                          src={capability.image}
                          alt=""
                          width={480}
                          height={400}
                          className="w-full transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    </Card>
                  </Spotlight>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lecturer intelligence ──────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-soft/30 to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="For teaching staff"
              title="Cohort-level intelligence, not a pile of PDFs"
              description="Every submission is analysed as it arrives, and rolls up into signals you can actually act on."
            />
          </Reveal>

          <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: "Class analytics",
                body: "Similarity distribution, risk bands, average writing quality and completion — per assignment and per course.",
              },
              {
                icon: GitCompare,
                title: "Document comparison",
                body: "Put two submissions side by side and see paragraph by paragraph where they overlap, and whether it is copied or reworded.",
              },
              {
                icon: BookOpen,
                title: "Peer review management",
                body: "Build rubrics, configure anonymous allocation, track completion, and see whether the feedback students give is any good.",
              },
            ].map((entry) => (
              <StaggerItem key={entry.title}>
                <TiltCard className="h-full" intensity={6}>
                  <Card className="flex h-full flex-col">
                    <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <entry.icon className="size-5" />
                    </span>
                    <h3 className="font-semibold">{entry.title}</h3>
                    <p className="mt-2 text-sm text-muted">{entry.body}</p>
                  </Card>
                </TiltCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Ghanaian higher education ──────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Local contribution"
              title="Built for Ghanaian higher education"
              description="Detection thresholds published elsewhere were derived from corpora written elsewhere. Whether they hold for Ghanaian undergraduate writing is the question this project exists to answer."
            />
          </Reveal>

          <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Ghanaian academic corpus",
                body: "Consented, anonymised undergraduate writing, labelled for the cases that matter — reworded sources, and independent work on a shared reading list.",
                status: "PENDING" as const,
              },
              {
                title: "Local model calibration",
                body: "Similarity thresholds re-derived against Ghanaian writing rather than inherited, so the flagging rate reflects the cohort being assessed.",
                status: "PENDING" as const,
              },
              {
                title: "Low-resource deployment",
                body: "A ~90MB model on CPU, no GPU and no per-request API cost — deployable on the infrastructure Ghanaian universities actually have.",
                status: "EXPERIMENTAL" as const,
              },
            ].map((entry) => (
              <StaggerItem key={entry.title}>
                <Card className="h-full">
                  <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <MapPin className="size-5" />
                  </span>
                  <div className="mb-2">
                    <MaturityBadge status={entry.status} />
                  </div>
                  <h3 className="font-semibold">{entry.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{entry.body}</p>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.15}>
            <div className="mt-8 text-center">
              <ButtonLink href="/research" variant="secondary">
                See what has and has not been measured
                <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Research & evaluation ──────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <Card className="overflow-hidden">
              <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
                <div>
                  <Badge tone="brand">Research prototype</Badge>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
                    Every claim on this site is labelled
                  </h2>
                  <p className="mt-3 text-muted">
                    Lume AI is a final-year research project, and it says so.
                    Working software is marked <em>implemented</em>. Software that
                    runs but has not been formally evaluated is marked{" "}
                    <em>experimental</em>. Research that has not been carried out
                    yet says <em>evaluation pending</em> instead of showing a
                    number.
                  </p>
                  <p className="mt-3 text-muted">
                    You will not find an accuracy percentage anywhere in this
                    application, because the labelled dataset it would be measured
                    against has not been collected yet. The harness that will
                    measure it is in the repository.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <ButtonLink href="/research">
                      Research &amp; evaluation
                      <ArrowRight className="size-4" />
                    </ButtonLink>
                    <ButtonLink href="/architecture" variant="secondary">
                      System architecture
                    </ButtonLink>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { metric: "Plagiarism detection precision", target: "≥ 85%" },
                    { metric: "System Usability Scale", target: "≥ 70" },
                    { metric: "Inference time per document", target: "< 3s" },
                    { metric: "Writing-quality improvement", target: "≥ 10%" },
                  ].map((row) => (
                    <div
                      key={row.metric}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted/40 px-4 py-3"
                    >
                      <span className="text-sm font-medium">{row.metric}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-sm tabular-nums text-muted">
                          Target {row.target}
                        </span>
                        <Badge tone="neutral">Evaluation pending</Badge>
                      </span>
                    </div>
                  ))}
                  <p className="text-xs text-muted">
                    These are the proposal&apos;s targets. None is claimed as
                    achieved.
                  </p>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ── Security & privacy ─────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="grid gap-8 rounded-3xl border border-border bg-surface p-8 shadow-[var(--shadow-sm)] lg:grid-cols-3 lg:p-12">
              {[
                {
                  icon: WifiOff,
                  title: "Nothing leaves the server",
                  body: "The embedding model runs locally from cached weights. Analysis makes no external call, and unpublished student work never reaches a third party.",
                },
                {
                  icon: Lock,
                  title: "Access enforced on the server",
                  body: "Role checks gate every action, and the comparison corpus is filtered by what the caller is entitled to read — not by hiding buttons.",
                },
                {
                  icon: ShieldCheck,
                  title: "Evidence, not verdicts",
                  body: "Every score comes with the passages behind it and a confidence figure. Similarity is a reason to look. A human decides.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <item.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-sm text-muted">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="glow-ring relative overflow-hidden rounded-3xl">
              <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 shadow-[var(--shadow-lg)] sm:p-12">
                <div className="aurora opacity-30" aria-hidden />
                <div className="relative grid gap-10 lg:grid-cols-2">
                  <div>
                    <Badge tone="brand">The Integrity Brief</Badge>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
                      Follow the research
                    </h2>
                    <p className="mt-3 text-muted">
                      Occasional notes on what the detection literature says, what
                      the evaluation finds once it runs, and what changed in the
                      platform.
                    </p>
                    <ul className="mt-6 space-y-2 text-sm">
                      {[
                        "Detection research, summarised without the hype",
                        "Evaluation results as they are measured",
                        "Platform changelog",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-risk-original" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="lg:pt-2">
                    <NewsletterForm source="landing" variant="panel" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-12 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Illuminate. Analyse. Improve.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted">
                Create an account to open the analysis workspace, or read how the
                system is built before you do.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/register" variant="gradient" className="px-6 py-3">
                  Explore Lume AI
                  <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink href="/how-it-works" variant="secondary" className="px-6 py-3">
                  How it works
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
