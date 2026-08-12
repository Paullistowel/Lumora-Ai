import { Cpu, Server, WifiOff } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ArchitectureDiagram } from "@/components/research/architecture-diagram";
import { MaturityBadge } from "@/components/brand";
import { Card, CardHeader, PageHeader, SectionHeading, Table, Td, Th } from "@/components/ui";
import { TECH_STACK } from "@/lib/research";

export const metadata = {
  title: "System architecture",
  description:
    "How Lume AI is put together — from the browser through the analysis engine to storage, all inside one deployment boundary.",
};

const DEPLOYMENT = [
  {
    icon: Cpu,
    title: "CPU-only inference",
    body: "The embedding model is ~90MB and runs on the CPU through transformers.js. No GPU is required, and there is no per-request inference cost.",
    status: "EXPERIMENTAL" as const,
    note: "Running and usable. Throughput on university-grade hardware has not been formally measured — see the research page.",
  },
  {
    icon: WifiOff,
    title: "No cloud inference",
    body: "Analysis calls no external service. Model weights are fetched once and cached on disk; after that the pipeline needs no outbound connection.",
    status: "EXPERIMENTAL" as const,
    note: "Implemented in the analysis path. A full audit of outbound requests across the whole application has not been completed.",
  },
  {
    icon: Server,
    title: "Single-host deployment",
    body: "Application, engine and database run on one host. PostgreSQL and object storage can be split out without code changes beyond configuration.",
    status: "IMPLEMENTED" as const,
    note: null,
  },
];

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Reveal>
        <PageHeader
          eyebrow="How it is built"
          title="System architecture"
          description="Lume AI is one application with one deployment boundary. A document enters at the top, and everything that happens to it happens on the same host."
        />
      </Reveal>

      <Reveal delay={0.1}>
        <ArchitectureDiagram />
      </Reveal>

      <section className="mt-20">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow="Deployment"
            title="Designed for the infrastructure that exists"
            description="The proposal targets universities running modest, CPU-only servers with unreliable outbound connectivity. That constraint shaped every technical choice above."
          />
        </Reveal>

        <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
          {DEPLOYMENT.map((entry) => (
            <StaggerItem key={entry.title}>
              <Card className="h-full">
                <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <entry.icon className="size-5" />
                </span>
                <div className="mb-2">
                  <MaturityBadge status={entry.status} />
                </div>
                <h3 className="font-semibold">{entry.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{entry.body}</p>
                {entry.note ? (
                  <p className="mt-3 border-t border-border pt-3 text-xs text-muted">
                    {entry.note}
                  </p>
                ) : null}
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mt-20">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow="Stack"
            title="What it is actually built with"
            description="Only technologies present in this repository are listed. Nothing here is aspirational."
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

      <section className="mt-20">
        <Reveal>
          <Card>
            <CardHeader
              title="The data path, end to end"
              description="What happens between a student pressing Analyse and a report appearing."
            />
            <ol className="space-y-4">
              {[
                {
                  step: "Upload or paste",
                  body: "The file is written to the document store under an opaque key, or the pasted text is stored directly. An Analysis row is created and the request returns immediately.",
                },
                {
                  step: "Extract and clean",
                  body: "PDF or Word text is extracted, whitespace and mangled punctuation normalised, and hyphenated line breaks repaired.",
                },
                {
                  step: "Segment",
                  body: "The document is split on blank lines into paragraphs. Documents without paragraph breaks are regrouped by sentence so chunks stay comparable in size.",
                },
                {
                  step: "Embed",
                  body: "Each paragraph becomes an L2-normalised vector. The comparison corpus is embedded with the same backend in the same run, so both sides live in the same vector space.",
                },
                {
                  step: "Compare",
                  body: "Cosine similarity against every corpus paragraph. Matches above the threshold are kept, classified as verbatim, near-verbatim or paraphrase by how much wording they share, and rolled up by paragraph length.",
                },
                {
                  step: "Analyse and report",
                  body: "Writing, integrity and style modules run over the same text. The whole report is serialised onto the Analysis row, and the progress endpoint flips to complete.",
                },
              ].map((entry, index) => (
                <li key={entry.step} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-semibold text-brand">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{entry.step}</p>
                    <p className="mt-0.5 text-sm text-muted">{entry.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
