import Link from "next/link";
import { ArrowRight, History, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnalysisWorkspace } from "@/components/analysis/workspace";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const metadata = {
  title: "Analysis workspace",
  description:
    "Upload a document or paste text, then run semantic similarity, academic writing, integrity and AI-style analysis.",
};

export default async function AnalysePage() {
  const user = await requireUser();

  const recent = await db.analysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      status: true,
      similarityScore: true,
      createdAt: true,
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Lume AI"
        title="Analysis workspace"
        description="Analyse any academic document or passage — a draft before you submit it, a paper you are reviewing, or work you want to understand better. Nothing here is tied to an assignment."
        action={
          recent.length > 0 ? (
            <ButtonLink href="/analyse/history" variant="secondary">
              <History className="size-4" />
              History
            </ButtonLink>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
        <AnalysisWorkspace role={user.role} />

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-brand" />
              How it works
            </h2>
            <ol className="mt-3 space-y-3 text-sm text-muted">
              {[
                "Your document is read and cleaned — PDF, Word, plain text or Markdown.",
                "It is split into paragraphs, and each becomes a semantic vector.",
                "Vectors are compared by cosine similarity against your chosen corpus.",
                "Writing, integrity and style modules run over the same text.",
              ].map((step, index) => (
                <li key={step} className="flex gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
              Processing happens on this server. Documents are never sent to an
              external service.
            </p>
          </Card>

          {recent.length > 0 ? (
            <Card>
              <h2 className="text-sm font-semibold">Recent analyses</h2>
              <ul className="mt-3 space-y-1">
                {recent.map((analysis) => (
                  <li key={analysis.id}>
                    <Link
                      href={`/analyse/${analysis.id}`}
                      className="focus-ring block rounded-xl px-2.5 py-2 transition-colors hover:bg-surface-muted"
                    >
                      <span className="block truncate text-sm">{analysis.title}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        {formatDateTime(analysis.createdAt)}
                        {analysis.status === "COMPLETE" &&
                        analysis.similarityScore !== null ? (
                          <Badge tone="neutral">{analysis.similarityScore}%</Badge>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/analyse/history"
                className="focus-ring mt-3 inline-flex items-center gap-1.5 rounded text-sm font-medium text-brand"
              >
                All analyses
                <ArrowRight className="size-3.5" />
              </Link>
            </Card>
          ) : null}
        </aside>
      </div>
    </>
  );
}
