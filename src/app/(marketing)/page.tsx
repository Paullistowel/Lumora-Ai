import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, BarChart3, BookOpen, Check, FileSearch, Gauge, Lock,
  ScanSearch, Sparkles, SpellCheck, Star, Users,
} from "lucide-react";
import {
  AnimatedHeading, Counter, Marquee, Parallax, Reveal, Spotlight,
  Stagger, StaggerItem, TiltCard, Layer3D,
} from "@/components/motion";
import { NewsletterForm } from "@/components/marketing/newsletter";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";

export const metadata = {
  title: "AI-AIMS — Catch the paraphrase, not just the copy-paste",
  description:
    "Semantic plagiarism detection, live grammar feedback, AI humanizing and anonymous peer review in one platform built for universities.",
};

const FEATURES = [
  {
    icon: ScanSearch,
    title: "Semantic plagiarism detection",
    body: "Every paragraph becomes a 384-dimension vector. Reworded text still matches its source, because the comparison is on meaning, not strings.",
    image: "/img/feature-embeddings.svg",
    href: "/features#detection",
    accent: "var(--brand)",
  },
  {
    icon: SpellCheck,
    title: "Live writing feedback",
    body: "Spelling, grammar, punctuation, wordiness and academic tone — underlined as students type, with one-click fixes and an explanation for each.",
    image: "/img/feature-grammar.svg",
    href: "/tools/grammar",
    accent: "var(--accent)",
  },
  {
    icon: Sparkles,
    title: "AI-style detection & humanizing",
    body: "Flags the uniform rhythm and stock vocabulary of generated prose, then rewrites it into something that reads like considered human writing.",
    image: "/img/feature-humanizer.svg",
    href: "/tools/humanizer",
    accent: "var(--accent-2)",
  },
  {
    icon: Users,
    title: "Anonymous peer review",
    body: "Balanced double-blind allocation, rubric scoring, and an AI check on whether each review is specific, constructive and respectful.",
    image: "/img/feature-peer-review.svg",
    href: "/features#peer-review",
    accent: "var(--brand)",
  },
  {
    icon: BarChart3,
    title: "Integrity analytics",
    body: "Similarity trends by course, department and semester. An Academic Integrity Index that leadership can actually act on.",
    image: "/img/feature-analytics.svg",
    href: "/features#analytics",
    accent: "var(--accent)",
  },
] as const;

const STEPS = [
  { n: "01", title: "Student submits", body: "PDF, DOCX, TXT or Markdown. Text is extracted and cleaned automatically." },
  { n: "02", title: "Split and embed", body: "The document is broken into paragraphs, each converted into a semantic vector." },
  { n: "03", title: "Compare", body: "Every paragraph is matched against every other submission for that assignment." },
  { n: "04", title: "Report", body: "A heatmap, a risk band and per-paragraph evidence — for the student and the lecturer." },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Our old checker scored a reworded essay at four percent. This one flagged it at forty-three and showed us exactly which paragraphs. That conversation with the student was completely different.",
    name: "Dr Amina Yusuf",
    role: "Senior Lecturer, Computer Science",
    avatar: "/img/avatar-1.svg",
  },
  {
    quote:
      "The peer review quality score changed the culture. Students stopped writing “good essay” once they could see their feedback being scored on whether it was actually useful.",
    name: "Prof. Daniel Achebe",
    role: "Head of Department, Engineering",
    avatar: "/img/avatar-2.svg",
  },
  {
    quote:
      "I used to get my similarity report two days after submitting. Now it's there in seconds, with the paragraph highlighted and an explanation of why it matched.",
    name: "Zainab Ibrahim",
    role: "Final-year student",
    avatar: "/img/avatar-3.svg",
  },
  {
    quote:
      "The integrity index gave us something to report to the academic board that wasn't just a count of misconduct cases. It shows the trend, not the incidents.",
    name: "Grace Mensah",
    role: "Academic Registrar",
    avatar: "/img/avatar-4.svg",
  },
] as const;

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
              <Link
                href="/tools/humanizer"
                className="focus-ring group mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 py-1.5 pr-3 pl-1.5 text-xs font-medium backdrop-blur transition-colors hover:border-brand/40"
              >
                <span className="rounded-full bg-gradient-to-r from-brand to-accent px-2 py-0.5 text-[11px] text-white">
                  New
                </span>
                AI-style detection and humanizer
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>

            <AnimatedHeading
              text="Catch the paraphrase, not just the copy-paste."
              className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
            />

            <Reveal delay={0.35}>
              <p className="mt-6 max-w-xl text-lg text-pretty text-muted">
                Word-matching plagiarism tools miss any student who bothers to
                reword. AI-AIMS compares <em>meaning</em> — so a rewritten
                paragraph still matches its source — and pairs it with live
                writing feedback and anonymous peer review.
              </p>
            </Reveal>

            <Reveal delay={0.45}>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/register" variant="gradient" className="px-6 py-3">
                  Get started free
                  <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink href="/tools/grammar" variant="secondary" className="px-6 py-3">
                  Try the grammar checker
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal delay={0.55}>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
                {["No credit card", "Free tools, no account", "Runs on your own server"].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-1.5">
                      <Check className="size-4 text-risk-original" />
                      {item}
                    </span>
                  ),
                )}
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
                      alt="Two student submissions side by side with matching paragraphs highlighted and an overall similarity score of 43 percent"
                      width={720}
                      height={560}
                      priority
                      className="w-full rounded-2xl"
                    />
                  </div>

                  {/* Floating stat chips lifted toward the viewer */}
                  <Layer3D z={60} className="pointer-events-none absolute -top-4 -left-4 hidden sm:block">
                    <div className="float rounded-2xl border border-border bg-surface px-3.5 py-2.5 shadow-[var(--shadow-lg)]">
                      <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">
                        Paraphrase caught
                      </p>
                      <p className="text-lg font-semibold text-risk-high">42.6%</p>
                    </div>
                  </Layer3D>

                  <Layer3D z={70} className="pointer-events-none absolute -right-3 -bottom-5 hidden sm:block">
                    <div
                      className="float rounded-2xl border border-border bg-surface px-3.5 py-2.5 shadow-[var(--shadow-lg)]"
                      style={{ animationDelay: "1.4s" }}
                    >
                      <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">
                        Analysis time
                      </p>
                      <p className="text-lg font-semibold text-risk-original">1.8s</p>
                    </div>
                  </Layer3D>
                </div>
              </TiltCard>
            </Parallax>
          </Reveal>
        </div>
      </section>

      {/* ── Logo strip ─────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface/50 py-8">
        <p className="mb-6 text-center text-xs font-medium tracking-[0.14em] text-muted uppercase">
          Designed for the way universities actually work
        </p>
        <Marquee duration={38}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Image
              key={i}
              src={`/img/crest-${i}.svg`}
              alt=""
              width={220}
              height={48}
              className="h-9 w-auto text-muted opacity-60 transition-opacity hover:opacity-100"
            />
          ))}
        </Marquee>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: 384, suffix: "", label: "Embedding dimensions", hint: "per paragraph" },
              { value: 42.6, suffix: "%", decimals: 1, label: "Paraphrase detected", hint: "where word-matching scored 0%" },
              { value: 1.8, suffix: "s", decimals: 1, label: "Report generated", hint: "extract to heatmap" },
              { value: 100, suffix: "%", label: "On-premise capable", hint: "no data leaves your servers" },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <Spotlight className="h-full rounded-2xl">
                  <Card className="h-full">
                    <p className="text-3xl font-semibold tracking-tight">
                      <Counter
                        to={stat.value}
                        suffix={stat.suffix}
                        decimals={stat.decimals ?? 0}
                      />
                    </p>
                    <p className="mt-2 text-sm font-medium">{stat.label}</p>
                    <p className="mt-0.5 text-xs text-muted">{stat.hint}</p>
                  </Card>
                </Spotlight>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="What it does"
              title="Five systems that work as one"
              description="Detection tells you something happened. The rest of the platform is what changes whether it happens again."
            />
          </Reveal>

          <div className="mt-14 grid gap-5 lg:grid-cols-6">
            {FEATURES.map((feature, i) => (
              <Reveal
                key={feature.title}
                delay={i * 0.07}
                className={i < 2 ? "lg:col-span-3" : "lg:col-span-2"}
              >
                <Link href={feature.href} className="focus-ring block h-full rounded-2xl">
                  <Spotlight className="h-full rounded-2xl">
                    <Card interactive className="flex h-full flex-col overflow-hidden">
                      <span
                        className="mb-4 flex size-11 items-center justify-center rounded-xl"
                        style={{
                          background: `color-mix(in srgb, ${feature.accent} 14%, transparent)`,
                          color: feature.accent,
                        }}
                      >
                        <feature.icon className="size-5" />
                      </span>

                      <h3 className="text-lg font-semibold">{feature.title}</h3>
                      <p className="mt-2 text-sm text-muted">{feature.body}</p>

                      <div className="mt-5 -mb-5 overflow-hidden rounded-t-xl border-t border-x border-border bg-surface-muted/60 pt-3">
                        <Image
                          src={feature.image}
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

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-soft/30 to-transparent" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="How it works"
              title="From upload to evidence in under two seconds"
              description="No queue, no overnight batch. The student sees the report before they leave the page."
            />
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.1}>
                <div className="relative h-full">
                  {i < STEPS.length - 1 ? (
                    <span
                      aria-hidden
                      className="absolute top-9 -right-3 hidden h-px w-6 bg-gradient-to-r from-border to-transparent lg:block"
                    />
                  ) : null}
                  <Card className="h-full">
                    <span className="mb-4 inline-flex items-baseline gap-2">
                      <span className="bg-gradient-to-br from-brand to-accent bg-clip-text text-3xl font-bold text-transparent">
                        {step.n}
                      </span>
                    </span>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-muted">{step.body}</p>
                  </Card>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Free tools ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Free, no account"
              title="Three tools you can use right now"
              description="Everything below runs entirely in your browser. Your text is never uploaded, stored or sent anywhere."
            />
          </Reveal>

          <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                href: "/tools/grammar",
                icon: SpellCheck,
                title: "Grammar checker",
                body: "Spelling, grammar, punctuation and academic tone, underlined live with one-click fixes.",
                cta: "Check my writing",
              },
              {
                href: "/tools/plagiarism",
                icon: FileSearch,
                title: "Plagiarism checker",
                body: "Paste your draft and your sources. See which paragraphs overlap semantically, and by how much.",
                cta: "Check for overlap",
              },
              {
                href: "/tools/humanizer",
                icon: Sparkles,
                title: "AI humanizer",
                body: "Score how machine-like your text reads, then rewrite the vocabulary and rhythm that gives it away.",
                cta: "Humanize my text",
              },
            ].map((tool) => (
              <StaggerItem key={tool.href}>
                <Link href={tool.href} className="focus-ring block h-full rounded-2xl">
                  <TiltCard className="h-full" intensity={6}>
                    <Card interactive className="flex h-full flex-col">
                      <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                        <tool.icon className="size-5" />
                      </span>
                      <h3 className="font-semibold">{tool.title}</h3>
                      <p className="mt-2 flex-1 text-sm text-muted">{tool.body}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                        {tool.cta}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Card>
                  </TiltCard>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="In practice"
              title="What changes when detection is semantic"
            />
          </Reveal>

          <Stagger className="mt-12 grid gap-5 md:grid-cols-2">
            {TESTIMONIALS.map((testimonial) => (
              <StaggerItem key={testimonial.name}>
                <Card className="flex h-full flex-col">
                  <div className="mb-4 flex gap-0.5" aria-label="Five out of five">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className="size-4 fill-risk-moderate text-risk-moderate" />
                    ))}
                  </div>
                  <blockquote className="flex-1 text-pretty">
                    “{testimonial.quote}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-5">
                    <Image
                      src={testimonial.avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 rounded-full"
                    />
                    <span>
                      <span className="block text-sm font-medium">{testimonial.name}</span>
                      <span className="block text-xs text-muted">{testimonial.role}</span>
                    </span>
                  </figcaption>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.2}>
            <p className="mt-6 text-center text-xs text-muted">
              Quotations are illustrative of the intended deployment, from a
              platform in academic development.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Trust ──────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="grid gap-8 rounded-3xl border border-border bg-surface p-8 shadow-[var(--shadow-sm)] lg:grid-cols-3 lg:p-12">
              {[
                { icon: Lock, title: "Your data stays yours", body: "Deploy on your own infrastructure. Submissions never leave your network, and the embedding model runs locally." },
                { icon: Gauge, title: "Evidence, not verdicts", body: "Every score comes with the paragraphs behind it. The tool points; a human decides." },
                { icon: BookOpen, title: "Teaching, not just catching", body: "Students see why a paragraph matched and how to cite it properly, before it becomes a misconduct case." },
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

      {/* ── Newsletter + CTA ───────────────────────────────────────────── */}
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
                      Monthly research on academic integrity
                    </h2>
                    <p className="mt-3 text-muted">
                      What actually reduces misconduct, what the detection
                      literature says, and what changed in the product. One
                      email a month, no filler.
                    </p>
                    <ul className="mt-6 space-y-2 text-sm">
                      {[
                        "Detection research, summarised without the hype",
                        "Policy templates you can adapt",
                        "Product changelog and roadmap",
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
                Ready to see it on your own work?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted">
                Create an account and submit a document, or try the free tools
                without signing up at all.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/register" variant="gradient" className="px-6 py-3">
                  Create free account
                  <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink href="/contact" variant="secondary" className="px-6 py-3">
                  Talk to us about your institution
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
