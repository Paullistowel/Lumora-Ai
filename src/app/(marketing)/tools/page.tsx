import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Lock, ScanSearch, Sparkles, SpellCheck, Zap } from "lucide-react";
import { Reveal, Stagger, StaggerItem, TiltCard } from "@/components/motion";
import { Badge, Card, PageHeader, SectionHeading } from "@/components/ui";

export const metadata = {
  title: "Free writing tools · AI-AIMS",
  description:
    "Grammar checker, plagiarism checker and AI humanizer. Free, no account, and your text never leaves your browser.",
};

const TOOLS = [
  {
    href: "/tools/grammar",
    icon: SpellCheck,
    title: "Grammar & style checker",
    body: "Spelling, commonly confused words, subject–verb agreement, punctuation, wordiness and academic tone — underlined as you type with a one-click fix and an explanation for each.",
    image: "/img/feature-grammar.svg",
    points: ["Live underlining", "One-click fixes", "Skips quotations and citations"],
    accent: "var(--brand)",
  },
  {
    href: "/tools/plagiarism",
    icon: ScanSearch,
    title: "Plagiarism & overlap checker",
    body: "Paste your draft and the sources you worked from. Get a per-paragraph overlap score and the closest matching passage, so you can see exactly where a citation belongs.",
    image: "/img/feature-embeddings.svg",
    points: ["Per-paragraph scores", "Shows the matching passage", "Risk banding"],
    accent: "var(--accent)",
  },
  {
    href: "/tools/humanizer",
    icon: Sparkles,
    title: "AI-style detector & humanizer",
    body: "Scores the uniform rhythm and stock vocabulary that make prose read as generated, then rewrites it. A style tool — it will not launder authorship, and the page says so.",
    image: "/img/feature-humanizer.svg",
    points: ["Style scoring with signals", "Selective rewriting", "Before/after comparison"],
    accent: "var(--accent-2)",
  },
] as const;

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Free tools"
        title="Three tools, no account, nothing uploaded"
        description="Every tool below runs entirely in your browser. Your draft is never transmitted, stored or logged — which matters when the text is unpublished coursework."
      />

      <Reveal>
        <div className="mb-12 flex flex-wrap gap-3">
          {[
            { icon: Lock, label: "Runs locally in your browser" },
            { icon: Zap, label: "Instant, no queue" },
            { icon: ArrowRight, label: "No sign-up required" },
          ].map((item) => (
            <Badge key={item.label} tone="brand" className="px-3 py-1.5">
              <item.icon className="size-3.5" />
              {item.label}
            </Badge>
          ))}
        </div>
      </Reveal>

      <Stagger className="grid gap-6 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <StaggerItem key={tool.href}>
            <Link href={tool.href} className="focus-ring block h-full rounded-2xl">
              <TiltCard className="h-full" intensity={5}>
                <Card interactive className="flex h-full flex-col">
                  <span
                    className="mb-4 flex size-11 items-center justify-center rounded-xl"
                    style={{
                      background: `color-mix(in srgb, ${tool.accent} 14%, transparent)`,
                      color: tool.accent,
                    }}
                  >
                    <tool.icon className="size-5" />
                  </span>

                  <h2 className="text-lg font-semibold">{tool.title}</h2>
                  <p className="mt-2 text-sm text-muted">{tool.body}</p>

                  <ul className="mt-4 space-y-1.5">
                    {tool.points.map((point) => (
                      <li key={point} className="flex items-center gap-2 text-sm text-muted">
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: tool.accent }}
                        />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                    Open tool
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>

                  <div className="mt-5 -mb-5 overflow-hidden rounded-t-xl border-x border-t border-border bg-surface-muted/60 pt-3">
                    <Image
                      src={tool.image}
                      alt=""
                      width={480}
                      height={400}
                      className="w-full transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                </Card>
              </TiltCard>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <div className="mt-20">
          <SectionHeading
            eyebrow="Why local"
            title="Your unpublished work should not leave your machine"
            description="Most free checkers upload your text to a server, and many reserve the right to retain it. For coursework that has not been submitted or marked yet, that is a real risk. These tools are built as pure client-side JavaScript: there is no upload endpoint to send your draft to."
          />
        </div>
      </Reveal>
    </div>
  );
}
