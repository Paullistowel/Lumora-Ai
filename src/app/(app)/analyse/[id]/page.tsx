import { notFound } from "next/navigation";
import { FileText, RefreshCw, Trash2, Type } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseReport } from "@/lib/analysis";
import { AnalysisProgress } from "@/components/analysis/progress";
import { AnalysisReportView } from "@/components/analysis/report";
import { Badge, Button, ButtonLink, Card, PageHeader } from "@/components/ui";
import { formatBytes, formatDateTime } from "@/lib/format";
import { deleteAnalysis, reanalyse } from "../actions";

export const metadata = { title: "Analysis report" };

export default async function AnalysisReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const analysis = await db.analysis.findUnique({
    where: { id },
    include: { references: { orderBy: { order: "asc" }, select: { label: true } } },
  });

  // An analysis is private to whoever ran it — including from staff.
  if (!analysis || analysis.userId !== user.id) notFound();

  const report = parseReport(analysis.report);
  const done = analysis.status === "COMPLETE" && report !== null;

  return (
    <>
      <PageHeader
        eyebrow="Lume AI analysis report"
        title={analysis.title}
        description={
          analysis.source === "UPLOAD"
            ? `${analysis.fileName} · ${formatBytes(analysis.fileSize)} · ${formatDateTime(analysis.createdAt)}`
            : `Pasted text · ${analysis.wordCount.toLocaleString()} words · ${formatDateTime(analysis.createdAt)}`
        }
        action={
          done ? (
            <div className="flex gap-2">
              <form
                action={async () => {
                  "use server";
                  await reanalyse(id);
                }}
              >
                <Button type="submit" variant="secondary">
                  <RefreshCw className="size-4" />
                  Re-analyse
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteAnalysis(id);
                }}
              >
                <Button type="submit" variant="ghost" aria-label="Delete this analysis">
                  <Trash2 className="size-4" />
                </Button>
              </form>
            </div>
          ) : null
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone="neutral">
          {analysis.source === "UPLOAD" ? (
            <FileText className="size-3.5" />
          ) : (
            <Type className="size-3.5" />
          )}
          {analysis.source === "UPLOAD"
            ? analysis.fileType?.toUpperCase()
            : "Pasted text"}
        </Badge>
        {analysis.references.map((reference) => (
          <Badge key={reference.label} tone="brand">
            {reference.label}
          </Badge>
        ))}
        {analysis.corpusScope === "PLATFORM" ? (
          <Badge tone="accent">Compared against your Lume AI corpus</Badge>
        ) : null}
      </div>

      {done ? (
        <AnalysisReportView report={report} />
      ) : (
        <AnalysisProgress
          analysisId={analysis.id}
          initialStatus={analysis.status as "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED"}
          initialStage={analysis.stage}
        />
      )}

      {done ? (
        <Card className="mt-6">
          <p className="text-xs text-muted">
            This report is private to your account. Lume AI is a research
            prototype: similarity, writing and style analysis are implemented and
            running, and the accuracy of the underlying models against a
            Ghanaian academic corpus is still being evaluated. See{" "}
            <ButtonLink href="/research" variant="ghost" className="px-1 py-0 text-xs">
              Research &amp; evaluation
            </ButtonLink>{" "}
            for what has and has not been measured.
          </p>
        </Card>
      ) : null}
    </>
  );
}
