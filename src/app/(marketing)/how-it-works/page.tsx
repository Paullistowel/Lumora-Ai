import {
  ArrowRight, ClipboardPaste, FileUp, GraduationCap, ScanSearch, Users,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ButtonLink, Card, CardHeader, PageHeader, SectionHeading } from "@/components/ui";

export const metadata = {
  title: "How it works",
  description:
    "The Lume AI workflow end to end — how students analyse and submit work, and how lecturers review, compare and assess it.",
};

const STUDENT_FLOW = [
  {
    title: "Analyse a draft before submitting",
    body: "Upload a document or paste your text in the workspace. You get similarity against sources you provide, writing feedback and integrity checks — privately, with nothing recorded against your assignment.",
  },
  {
    title: "Fix what the report points at",
    body: "Every flagged paragraph shows the passage it matched and why. Every writing issue comes with what to change, not just a score.",
  },
  {
    title: "Submit the assignment",
    body: "Choose the course and assignment, upload the final document, and watch it move through uploaded → processing → analysed.",
  },
  {
    title: "Read your originality report",
    body: "Paragraph heatmap, matched passages and a risk band, with peer sources anonymised. A score is never presented as an accusation.",
  },
  {
    title: "Review a classmate's work",
    body: "Reviews are double-blind. You score against the rubric your lecturer set, and your feedback is itself assessed for whether it is specific and constructive.",
  },
  {
    title: "Watch your writing change",
    body: "Every score Lume AI computes for you is kept in order, so you can see whether the feedback is actually landing.",
  },
];

const LECTURER_FLOW = [
  {
    title: "Set up the assignment",
    body: "Course, deadline, marks, late policy, similarity threshold, and whether peer review runs — with how many reviewers per student.",
  },
  {
    title: "Build a rubric",
    body: "Weighted criteria that both peer reviewers and your own marking work from, reusable across assignments.",
  },
  {
    title: "Watch submissions arrive",
    body: "Each one is extracted, embedded and compared against its cohort automatically. No overnight batch, no queue to manage.",
  },
  {
    title: "Review the similarity reports",
    body: "Filter by course and risk band. Open a report to read the matched passages with the author's name attached — you are entitled to see it, students are not.",
  },
  {
    title: "Compare two documents directly",
    body: "When two submissions look related, put them side by side and see paragraph by paragraph exactly where and how they overlap.",
  },
  {
    title: "Analyse anything else",
    body: "The workspace is yours too. Upload a research paper, a draft, or work from outside the platform entirely, and run the same analysis on it.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Reveal>
        <PageHeader
          eyebrow="How it works"
          title="Upload. Analyse. Understand. Improve."
          description="Lume AI is two things at once: a workspace where anyone can analyse an academic document, and an assessment workflow that runs a whole cohort. This is how both work."
        />
      </Reveal>

      {/* ── The pipeline ─────────────────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <Card className="mb-16 overflow-hidden">
          <CardHeader
            title="What happens to a document"
            description="The same pipeline runs whether the document is a formal submission or a draft you are checking privately."
            icon={<ScanSearch className="size-4" />}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "01",
                title: "Read",
                body: "Text is extracted from PDF, Word, plain text or Markdown, then cleaned of the artefacts extraction leaves behind.",
              },
              {
                n: "02",
                title: "Split and embed",
                body: "The document becomes paragraphs, and each paragraph becomes a vector that encodes its meaning rather than its wording.",
              },
              {
                n: "03",
                title: "Compare",
                body: "Cosine similarity against the corpus. Because the comparison is on meaning, a rewritten paragraph still matches its source.",
              },
              {
                n: "04",
                title: "Report",
                body: "A heatmap, a risk band, the matched passages, and — separately — what the writing itself needs.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="rounded-2xl border border-border bg-surface-muted/40 p-4"
              >
                <span className="bg-gradient-to-br from-brand to-accent bg-clip-text text-2xl font-bold text-transparent">
                  {step.n}
                </span>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      {/* ── Two ways in ──────────────────────────────────────────────────── */}
      <section className="mb-16">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow="Two ways in"
            title="A file, or the text itself"
            description="Analysis is not tied to submitting an assignment. Students and lecturers both get the full workspace."
          />
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            {
              icon: FileUp,
              title: "Upload a document",
              body: "Drag a PDF, DOCX, DOC, TXT or Markdown file in, up to 15MB. File name, size and type are shown before anything runs, and processing status is reported stage by stage.",
            },
            {
              icon: ClipboardPaste,
              title: "Paste the text",
              body: "For a draft that is not a file yet. Word and character counts update as you type, and the same analysis modules run on it.",
            },
          ].map((entry) => (
            <Reveal key={entry.title}>
              <Card className="h-full">
                <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <entry.icon className="size-5" />
                </span>
                <h3 className="text-lg font-semibold">{entry.title}</h3>
                <p className="mt-2 text-sm text-muted">{entry.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Role flows ───────────────────────────────────────────────────── */}
      <section className="grid gap-8 lg:grid-cols-2">
        {[
          { icon: GraduationCap, title: "As a student", flow: STUDENT_FLOW },
          { icon: Users, title: "As a lecturer", flow: LECTURER_FLOW },
        ].map((role) => (
          <Reveal key={role.title}>
            <div>
              <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <role.icon className="size-4" />
                </span>
                {role.title}
              </h2>
              <Stagger className="space-y-3">
                {role.flow.map((step, index) => (
                  <StaggerItem key={step.title}>
                    <div className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-xs font-semibold text-muted">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{step.title}</p>
                        <p className="mt-1 text-sm text-muted">{step.body}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </Reveal>
        ))}
      </section>

      <Reveal delay={0.1}>
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            See it on a document of your own
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-muted">
            Create an account to open the workspace, or read how the system is put
            together first.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/register" variant="gradient" className="px-6 py-3">
              Explore Lume AI
              <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="/architecture" variant="secondary" className="px-6 py-3">
              System architecture
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
