import Image from "next/image";
import { Compass, Eye, GraduationCap, Scale, ShieldCheck } from "lucide-react";
import { Counter, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ButtonLink, Card, PageHeader, SectionHeading } from "@/components/ui";

export const metadata = {
  title: "About · AI-AIMS",
  description:
    "Why we built a semantic academic integrity platform, and the principles that shape how it behaves.",
};

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Evidence, never verdicts",
    body: "A similarity score is a reason to look, not a finding of misconduct. Every number in this platform comes with the paragraphs behind it, and every screen that shows a score also shows its confidence. The tool points; a human decides.",
  },
  {
    icon: GraduationCap,
    title: "Teach before you catch",
    body: "Most plagiarism is not calculated cheating — it is a student who took notes badly, ran out of time, and never learned what a citation is for. Showing them why a paragraph matched, before it becomes a disciplinary case, prevents more misconduct than detection alone ever will.",
  },
  {
    icon: ShieldCheck,
    title: "Student work stays private",
    body: "Unpublished coursework is sensitive. The embedding model runs locally, the browser tools never upload anything, and an on-premise deployment means no submission leaves your institution's network. We do not train models on student work.",
  },
  {
    icon: Scale,
    title: "Fair by construction",
    body: "Peer review is double-blind and allocation is balanced by design, not by chance. Similarity is scoped per assignment so shared reading lists don't look like collusion. Quotations and citations are excluded from grammar correction.",
  },
] as const;

const TIMELINE = [
  {
    period: "The problem",
    title: "Word-matching stopped working",
    body: "Every mainstream checker compares strings. A student who spends ten minutes rewording scores near zero — and generative models made that ten minutes into ten seconds. Detection built on surface form had quietly stopped measuring what it claimed to measure.",
  },
  {
    period: "The approach",
    title: "Compare meaning instead",
    body: "Sentence-transformer embeddings represent a paragraph as a point in semantic space. Two passages that argue the same thing land close together regardless of vocabulary. That single change is what lets the system catch a paraphrase.",
  },
  {
    period: "The scope",
    title: "Detection alone changes nothing",
    body: "A number on a dashboard does not improve anyone's writing. So the platform grew: writing feedback that explains what to fix, peer review that teaches students to read critically, and analytics that show whether any of it is working.",
  },
  {
    period: "Now",
    title: "One platform, twenty modules",
    body: "Assignment workflow, semantic detection, writing feedback, AI-style analysis, peer review with quality scoring, rubrics, dashboards for three roles, notifications, audit logging and a knowledge base.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="About"
        title="Academic integrity is a teaching problem, not a policing problem"
        description="We built AI-AIMS because the tools universities rely on had stopped detecting the thing they were bought to detect — and because catching students was never the point."
      />

      {/* Numbers */}
      <Reveal>
        <Stagger className="grid gap-4 sm:grid-cols-3">
          {[
            { to: 20, suffix: "", label: "Modules", hint: "detection to administration" },
            { to: 384, suffix: "", label: "Dimensions", hint: "per paragraph embedding" },
            { to: 0, suffix: "", label: "Bytes uploaded", hint: "by the free browser tools" },
          ].map((stat) => (
            <StaggerItem key={stat.label}>
              <Card className="text-center">
                <p className="text-4xl font-semibold tracking-tight">
                  <Counter to={stat.to} suffix={stat.suffix} />
                </p>
                <p className="mt-2 font-medium">{stat.label}</p>
                <p className="mt-0.5 text-sm text-muted">{stat.hint}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Reveal>

      {/* Story */}
      <Reveal>
        <section className="mt-24">
          <SectionHeading
            eyebrow="How we got here"
            title="Four decisions that shaped the platform"
          />

          <div className="mx-auto mt-12 max-w-3xl">
            <ol className="relative space-y-8 border-l border-border pl-8">
              {TIMELINE.map((entry, i) => (
                <Reveal key={entry.title} delay={i * 0.08}>
                  <li className="relative">
                    <span className="absolute top-1.5 -left-[2.3rem] flex size-4 items-center justify-center rounded-full border-2 border-brand bg-background">
                      <span className="size-1.5 rounded-full bg-brand" />
                    </span>
                    <p className="text-xs font-semibold tracking-wide text-brand uppercase">
                      {entry.period}
                    </p>
                    <h3 className="mt-1.5 text-lg font-semibold">{entry.title}</h3>
                    <p className="mt-2 text-pretty text-muted">{entry.body}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      </Reveal>

      {/* Principles */}
      <Reveal>
        <section className="mt-24">
          <SectionHeading
            eyebrow="Principles"
            title="Four commitments the code has to keep"
            description="These are not marketing lines — each one corresponds to a decision you can find in the implementation."
          />

          <Stagger className="mt-12 grid gap-5 md:grid-cols-2">
            {PRINCIPLES.map((principle) => (
              <StaggerItem key={principle.title}>
                <Card interactive className="h-full">
                  <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <principle.icon className="size-5" />
                  </span>
                  <h3 className="text-lg font-semibold">{principle.title}</h3>
                  <p className="mt-2 text-pretty text-muted">{principle.body}</p>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Reveal>

      {/* Honest note */}
      <Reveal>
        <section className="mt-24">
          <Card className="mx-auto max-w-3xl">
            <div className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Compass className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Where we are honestly at</h2>
                <p className="mt-2 text-pretty text-muted">
                  AI-AIMS is a working platform in academic development, not a
                  decade-old company. The detection engine, writing feedback,
                  peer review and dashboards are built and running. Report
                  export, SSO and the standalone department dashboard are on the
                  roadmap, not shipped. We would rather tell you that than let
                  you find out during a pilot.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </Reveal>

      {/* CTA */}
      <Reveal>
        <section className="mt-20">
          <div className="glow-ring relative rounded-3xl">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-10 text-center shadow-[var(--shadow-lg)]">
              <div className="aurora opacity-25" aria-hidden />
              <div className="relative">
                <Image
                  src="/img/feature-peer-review.svg"
                  alt=""
                  width={200}
                  height={167}
                  className="mx-auto mb-4 opacity-80"
                />
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                  Want to try it on your own department?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-muted">
                  Start with one course for a term. We will help you set it up
                  and you can decide from real numbers.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <ButtonLink href="/contact" variant="gradient" className="px-6 py-3">
                    Get in touch
                  </ButtonLink>
                  <ButtonLink href="/features" variant="secondary" className="px-6 py-3">
                    See the full feature list
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
