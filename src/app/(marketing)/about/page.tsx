import Image from "next/image";
import {
  Compass, Eye, GraduationCap, Scale, ShieldCheck, Users,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { MaturityBadge, type MaturityKey } from "@/components/brand";
import {
  ButtonLink, Card, CardHeader, PageHeader, SectionHeading, Table, Td, Th,
} from "@/components/ui";
import {
  OBJECTIVES, RESEARCH_GAP, RESEARCH_PROBLEM, TECH_STACK,
} from "@/lib/research";

export const metadata = {
  title: "About",
  description:
    "Lume AI is a final-year research project by Group 4 at KNUST: an AI-powered academic integrity and peer review platform for higher education.",
};

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Evidence, never verdicts",
    body: "A similarity score is a reason to look, not a finding of misconduct. Every number in this platform comes with the passages behind it, and every screen that shows a score also shows its confidence. The tool points; a human decides.",
  },
  {
    icon: GraduationCap,
    title: "Teach before you catch",
    body: "Most plagiarism is not calculated cheating — it is a student who took notes badly, ran out of time, and never learned what a citation is for. Showing them why a paragraph matched, before it becomes a disciplinary case, prevents more misconduct than detection alone ever will.",
  },
  {
    icon: ShieldCheck,
    title: "Student work stays private",
    body: "Unpublished coursework is sensitive. The embedding model runs locally, an analysis is private to whoever ran it, and an on-premise deployment means no submission leaves the institution's network. No model is trained on student work.",
  },
  {
    icon: Scale,
    title: "Say what has not been measured",
    body: "This is a research prototype and it labels itself as one. Where a result exists it is shown; where a study has not been run, the interface says evaluation pending rather than filling the gap with a plausible number.",
  },
] as const;

const PROJECT = [
  { label: "Project", value: "Lume AI — AI-Powered Academic Integrity & Peer Review Platform" },
  { label: "Team", value: "Group 4" },
  { label: "Institution", value: "Kwame Nkrumah University of Science and Technology (KNUST)" },
  { label: "Year", value: "2026" },
  { label: "Type", value: "Final-year research project · prototype" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Reveal>
        <PageHeader
          eyebrow="About"
          title="About Lume AI"
          description="Academic integrity is a teaching problem before it is a policing problem. Lume AI is a research prototype built around that idea — and honest about which parts of it have been proven."
        />
      </Reveal>

      {/* ── Project identity ─────────────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <Card className="mb-16">
          <CardHeader title="The project" icon={<Users className="size-4" />} />
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROJECT.map((entry) => (
              <div
                key={entry.label}
                className="rounded-xl border border-border bg-surface-muted/40 p-4"
              >
                <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {entry.label}
                </dt>
                <dd className="mt-1 text-sm font-medium">{entry.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted">
            Individual team member and supervisor names are not published here.
            They belong in the submitted report, and inventing them would be
            worse than omitting them.
          </p>
        </Card>
      </Reveal>

      {/* ── Problem & gap ────────────────────────────────────────────────── */}
      <section className="mb-16 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <CardHeader title="The research problem" />
            <h3 className="text-lg font-semibold">{RESEARCH_PROBLEM.title}</h3>
            <p className="mt-2 text-pretty text-muted">{RESEARCH_PROBLEM.body}</p>
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="h-full">
            <CardHeader title="The research gap" />
            <h3 className="text-lg font-semibold">{RESEARCH_GAP.title}</h3>
            <p className="mt-2 text-pretty text-muted">{RESEARCH_GAP.body}</p>
          </Card>
        </Reveal>
      </section>

      {/* ── Objectives ───────────────────────────────────────────────────── */}
      <section className="mb-16">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow="Contribution"
            title="What the project set out to deliver"
            description="Each objective carries its actual status, not its intended one."
          />
        </Reveal>
        <Stagger className="mt-8 grid gap-4 md:grid-cols-2">
          {OBJECTIVES.map((objective) => (
            <StaggerItem key={objective.id}>
              <Card className="h-full">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-muted">{objective.id}</span>
                  <MaturityBadge status={objective.status as MaturityKey} />
                </div>
                <h3 className="font-semibold">{objective.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{objective.detail}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal delay={0.1}>
          <p className="mt-6 text-sm text-muted">
            The full evaluation picture — dataset status, model benchmark,
            usability and writing studies — is on the{" "}
            <ButtonLink href="/research" variant="ghost" className="px-1 py-0 text-sm">
              research and evaluation
            </ButtonLink>{" "}
            page.
          </p>
        </Reveal>
      </section>

      {/* ── Principles ───────────────────────────────────────────────────── */}
      <section className="mb-16">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow="Principles"
            title="Four commitments the code has to keep"
            description="Each one corresponds to a decision you can find in the implementation, not a marketing line."
          />
        </Reveal>

        <Stagger className="mt-8 grid gap-5 md:grid-cols-2">
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

      {/* ── Technology ───────────────────────────────────────────────────── */}
      <section className="mb-16">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow="Technology"
            title="What it is built with"
            description="Only technologies actually present in the repository are listed."
          />
        </Reveal>
        <div className="mt-8">
          <Table>
            <thead>
              <tr>
                <Th>Layer</Th>
                <Th>Technology</Th>
              </tr>
            </thead>
            <tbody>
              {TECH_STACK.map((entry) => (
                <tr key={entry.layer}>
                  <Td className="font-medium whitespace-nowrap">{entry.layer}</Td>
                  <Td className="text-muted">{entry.value}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>

      {/* ── Honest note ──────────────────────────────────────────────────── */}
      <Reveal>
        <Card className="mx-auto max-w-3xl">
          <div className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Compass className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Where the project honestly stands</h2>
              <p className="mt-2 text-pretty text-muted">
                The detection engine, the analysis workspace, writing feedback,
                integrity checks, peer review and the role dashboards are built
                and running. The Ghanaian corpus has not been collected, the model
                benchmark has therefore not been run, and neither the usability
                study nor the writing-improvement study has taken place. The
                harness and the schema for all three are in the repository, so the
                figures will appear the moment the data does.
              </p>
            </div>
          </div>
        </Card>
      </Reveal>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
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
                  Illuminate. Analyse. Improve.
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-muted">
                  Open the workspace and run Lume AI on a document of your own, or
                  read how the system is put together first.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <ButtonLink href="/register" variant="gradient" className="px-6 py-3">
                    Explore Lume AI
                  </ButtonLink>
                  <ButtonLink href="/architecture" variant="secondary" className="px-6 py-3">
                    System architecture
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
