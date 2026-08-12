import Link from "next/link";
import {
  BookOpen, GraduationCap, LifeBuoy, MessageSquare, ScanSearch,
  Settings, ShieldCheck, Upload, Users,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ButtonLink, Card, PageHeader, SectionHeading } from "@/components/ui";

export const metadata = {
  title: "Help centre · AI-AIMS",
  description:
    "Guides and answers for students, lecturers and administrators using AI-AIMS.",
};

const CATEGORIES = [
  { icon: Upload, title: "Submitting work", body: "File formats, deadlines, versions and what happens after you upload.", count: 6 },
  { icon: ScanSearch, title: "Understanding your score", body: "How similarity is calculated, what the bands mean, and what to do about a flag.", count: 7 },
  { icon: Users, title: "Peer review", body: "Anonymity, allocation, writing useful feedback and how reviews are scored.", count: 5 },
  { icon: GraduationCap, title: "For lecturers", body: "Creating assignments, rubrics, thresholds, allocation and marking.", count: 8 },
  { icon: Settings, title: "For administrators", body: "Departments, courses, staff accounts, audit and deployment.", count: 6 },
  { icon: ShieldCheck, title: "Privacy & data", body: "Who sees what, retention, and exercising your data rights.", count: 4 },
] as const;

const FAQ: { group: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    group: "Submitting and scoring",
    items: [
      {
        q: "Which file formats can I submit?",
        a: <>PDF, DOCX, TXT and Markdown, up to 15MB. Scanned PDFs with no text layer will fail — the system tells you so rather than silently scoring an empty document. Export a text-based PDF from your word processor instead.</>,
      },
      {
        q: "My similarity score is high. Am I in trouble?",
        a: <>Not automatically. A score is a prompt for your lecturer to look, not a finding. Correctly quoted and cited material registers as similar by design, and students working from the same reading list produce genuinely overlapping arguments. Open the report, check every flagged paragraph has a citation, and fix any that do not before the deadline.</>,
      },
      {
        q: "Why did my score change after I submitted?",
        a: <>Your report is recomputed when classmates submit. If someone submits work matching yours after you did, both reports update. That is why a 0% score on an empty corpus is shown with zero confidence rather than as proof of originality.</>,
      },
      {
        q: "Can I resubmit?",
        a: <>Yes, until the assignment is locked or the deadline passes with late submission disabled. Every version is kept, but only your latest counts and only it is compared against the class. Your earlier versions are never matched against your new one.</>,
      },
      {
        q: "What counts as a match?",
        a: <>A paragraph scoring 0.75 or above in cosine similarity against another student&apos;s paragraph. Matches are weighted by paragraph length, so a matched body paragraph moves your score more than a matched heading.</>,
      },
    ],
  },
  {
    group: "Peer review",
    items: [
      {
        q: "Will the author know I reviewed them?",
        a: <>No. Review is double-blind — you never see whose work you are reviewing, and they never see who wrote the feedback. Your lecturer can see both sides, which is what keeps the system accountable.</>,
      },
      {
        q: "How is my review quality scored?",
        a: <>Out of 100, across four dimensions: depth (is there enough substance), specificity (do you name the paragraph or section), constructiveness (do you suggest a fix, not just a fault) and respectfulness (do you critique the work rather than the person). &ldquo;Good essay&rdquo; scores zero and is flagged to your lecturer.</>,
      },
      {
        q: "How are reviewers allocated?",
        a: <>By a rotating offset over a shuffled ring, which guarantees every submission gets the same number of reviews and every student writes the same number. A purely random draw would leave some students with none and others with five.</>,
      },
    ],
  },
  {
    group: "The free tools",
    items: [
      {
        q: "Is my text really not uploaded?",
        a: <>Correct. The grammar checker, plagiarism checker and humanizer are client-side JavaScript. There is no upload endpoint in the code to send your draft to. You can verify it by opening your browser&apos;s network tab while typing.</>,
      },
      {
        q: "Does the humanizer help me avoid detection?",
        a: <>No, and please do not use it that way. It changes style — vocabulary and rhythm — not authorship. If your department requires you to disclose AI assistance, using it does not discharge that obligation, and passing off generated work as your own is misconduct regardless of how it reads.</>,
      },
      {
        q: "Why does the browser plagiarism checker differ from my submission report?",
        a: <>The browser tool has no corpus, so it compares against sources you paste in using word-overlap. Your submission report uses transformer embeddings against your whole cohort, which is what catches paraphrase. Treat the browser tool as a pre-submission sanity check, not a prediction of your real score.</>,
      },
    ],
  },
  {
    group: "Accounts",
    items: [
      {
        q: "I did not get my verification code.",
        a: <>Check spam first. On a development or self-hosted deployment with no mail server configured, the code is printed to the server console instead — ask your administrator. You can request a new code by signing in again.</>,
      },
      {
        q: "I am a lecturer and cannot see my course.",
        a: <>Courses are assigned to lecturers by an administrator. Until someone assigns you, the course will not appear and you cannot publish assignments to it. Ask your department administrator to set you as its lecturer.</>,
      },
      {
        q: "I changed my password and got signed out everywhere.",
        a: <>That is deliberate. Changing a password ends every other session immediately, so that if someone else had access they lose it at once rather than at token expiry.</>,
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Help centre"
        title="How can we help?"
        description="Answers for students, lecturers and administrators. If something here is unclear, that's a documentation bug — tell us."
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => (
          <StaggerItem key={category.title}>
            <Card interactive className="h-full">
              <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <category.icon className="size-4.5" />
              </span>
              <h2 className="font-semibold">{category.title}</h2>
              <p className="mt-1.5 text-sm text-muted">{category.body}</p>
              <p className="mt-3 text-xs text-muted">{category.count} articles</p>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <section className="mt-24">
          <SectionHeading
            eyebrow="Common questions"
            title="The things people actually ask"
          />

          <div className="mx-auto mt-12 max-w-3xl space-y-10">
            {FAQ.map((section) => (
              <div key={section.group}>
                <h3 className="mb-4 text-xs font-semibold tracking-wide text-brand uppercase">
                  {section.group}
                </h3>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <details
                      key={item.q}
                      className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
                    >
                      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                        {item.q}
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-transform group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-sm text-pretty text-muted">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-20 grid gap-5 md:grid-cols-2">
          <Card className="flex flex-col items-start">
            <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <BookOpen className="size-4.5" />
            </span>
            <h2 className="text-lg font-semibold">Learn about integrity</h2>
            <p className="mt-2 flex-1 text-sm text-muted">
              What plagiarism actually is, how citation styles differ, and how
              your similarity score is calculated — written for students, not
              lawyers.
            </p>
            <ButtonLink href="/integrity" variant="secondary" className="mt-4">
              Open the guide
            </ButtonLink>
          </Card>

          <Card className="flex flex-col items-start">
            <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <MessageSquare className="size-4.5" />
            </span>
            <h2 className="text-lg font-semibold">Still stuck?</h2>
            <p className="mt-2 flex-1 text-sm text-muted">
              A real person reads every message and replies within two working
              days. Security reports are acknowledged within 24 hours.
            </p>
            <ButtonLink href="/contact" className="mt-4">
              <LifeBuoy className="size-4" /> Contact support
            </ButtonLink>
          </Card>
        </section>
      </Reveal>

      <Reveal>
        <p className="mt-10 text-center text-sm text-muted">
          Looking for licensing answers? Those live on the{" "}
          <Link href="/pricing" className="font-medium text-brand hover:underline">
            pricing page
          </Link>
          .
        </p>
      </Reveal>
    </div>
  );
}
