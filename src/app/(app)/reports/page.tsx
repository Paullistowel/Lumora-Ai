import Link from "next/link";
import {
  ClipboardList, Download, FileText, ScanSearch, Type, Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { riskBand, type RiskLevel } from "@/lib/risk";
import {
  Badge, ButtonLink, Card, EmptyState, PageHeader, Select, Stat,
} from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Reports",
  description:
    "Every Lume AI report generated for your work — assignment submissions and workspace analyses in one place.",
};

type ReportKind = "SUBMISSION" | "ANALYSIS";

type Row = {
  id: string;
  kind: ReportKind;
  href: string;
  downloadHref: string | null;
  title: string;
  context: string;
  fileType: string;
  status: string;
  statusTone: "neutral" | "brand" | "success" | "danger" | "warning";
  similarity: number | null;
  riskLevel: RiskLevel | null;
  writingScore: number | null;
  createdAt: Date;
};

const STATUS_TONE = {
  PENDING: "neutral",
  PROCESSING: "brand",
  COMPLETE: "success",
  FAILED: "danger",
} as const;

const STATUS_LABEL = {
  PENDING: "Queued",
  PROCESSING: "Processing",
  COMPLETE: "Completed",
  FAILED: "Failed",
} as const;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; status?: string; sort?: string }>;
}) {
  const user = await requireUser();
  const { q, kind, status, sort } = await searchParams;

  // Both report families the platform produces for this user, in one list.
  const [submissions, analyses] = await Promise.all([
    user.role === "STUDENT"
      ? db.submission.findMany({
          where: { studentId: user.id },
          orderBy: { submittedAt: "desc" },
          select: {
            id: true,
            fileName: true,
            fileType: true,
            status: true,
            version: true,
            submittedAt: true,
            assignment: {
              select: { title: true, course: { select: { code: true } } },
            },
            similarityResult: { select: { overallScore: true, riskLevel: true } },
            writingFeedback: { select: { overallScore: true } },
          },
        })
      : Promise.resolve([]),
    db.analysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        source: true,
        fileType: true,
        status: true,
        similarityScore: true,
        riskLevel: true,
        writingScore: true,
        createdAt: true,
      },
    }),
  ]);

  let rows: Row[] = [
    ...submissions.map((submission) => ({
      id: submission.id,
      kind: "SUBMISSION" as const,
      href: `/student/submissions/${submission.id}`,
      downloadHref: `/api/files/submission/${submission.id}`,
      title: submission.assignment.title,
      context: `${submission.assignment.course.code} · ${submission.fileName} · v${submission.version}`,
      fileType: submission.fileType.toUpperCase(),
      status: submission.status,
      statusTone: STATUS_TONE[submission.status as keyof typeof STATUS_TONE] ?? "neutral",
      similarity: submission.similarityResult?.overallScore ?? null,
      riskLevel: (submission.similarityResult?.riskLevel as RiskLevel) ?? null,
      writingScore: submission.writingFeedback?.overallScore ?? null,
      createdAt: submission.submittedAt,
    })),
    ...analyses.map((analysis) => ({
      id: analysis.id,
      kind: "ANALYSIS" as const,
      href: `/analyse/${analysis.id}`,
      downloadHref:
        analysis.source === "UPLOAD" ? `/api/files/analysis/${analysis.id}` : null,
      title: analysis.title,
      context:
        analysis.source === "UPLOAD" ? "Workspace · uploaded document" : "Workspace · pasted text",
      fileType: analysis.fileType?.toUpperCase() ?? "TEXT",
      status: analysis.status,
      statusTone: STATUS_TONE[analysis.status as keyof typeof STATUS_TONE] ?? "neutral",
      similarity: analysis.similarityScore,
      riskLevel: (analysis.riskLevel as RiskLevel) ?? null,
      writingScore: analysis.writingScore,
      createdAt: analysis.createdAt,
    })),
  ];

  const total = rows.length;

  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (row) =>
        row.title.toLowerCase().includes(needle) ||
        row.context.toLowerCase().includes(needle),
    );
  }
  if (kind && kind !== "ALL") rows = rows.filter((row) => row.kind === kind);
  if (status && status !== "ALL") rows = rows.filter((row) => row.status === status);

  rows.sort((a, b) => {
    switch (sort) {
      case "oldest":
        return a.createdAt.getTime() - b.createdAt.getTime();
      case "highest":
        return (b.similarity ?? -1) - (a.similarity ?? -1);
      case "lowest":
        return (a.similarity ?? 999) - (b.similarity ?? 999);
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const completed = rows.filter((row) => row.status === "COMPLETE");
  const scored = completed.filter((row) => row.similarity !== null);
  const averageSimilarity =
    scored.length > 0
      ? scored.reduce((sum, row) => sum + (row.similarity ?? 0), 0) / scored.length
      : null;
  const writingScores = completed.filter((row) => row.writingScore !== null);
  const averageWriting =
    writingScores.length > 0
      ? writingScores.reduce((sum, row) => sum + (row.writingScore ?? 0), 0) /
        writingScores.length
      : null;

  const filtered = q || (kind && kind !== "ALL") || (status && status !== "ALL");

  return (
    <>
      <PageHeader
        eyebrow="Lume AI"
        title="Reports"
        description="Every report Lume AI has generated for you — assignment submissions and workspace analyses together."
        action={
          <ButtonLink href="/analyse" variant="gradient">
            <ScanSearch className="size-4" />
            New analysis
          </ButtonLink>
        }
      />

      {total > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Reports" value={total} hint="Across all sources" />
          <Stat
            label="Completed"
            value={completed.length}
            hint={`${total - completed.length} still processing or failed`}
          />
          <Stat
            label="Average similarity"
            value={averageSimilarity === null ? "—" : `${averageSimilarity.toFixed(1)}%`}
            hint={averageSimilarity === null ? "Nothing scored yet" : "Across scored reports"}
          />
          <Stat
            label="Average writing score"
            value={averageWriting === null ? "—" : Math.round(averageWriting)}
            hint={averageWriting === null ? "No feedback yet" : "out of 100"}
          />
        </div>
      ) : null}

      <form className="mb-5 flex flex-wrap gap-2" role="search">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by title, course or file…"
          aria-label="Search reports"
          className="focus-ring min-w-0 flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm sm:max-w-xs"
        />
        <Select name="kind" defaultValue={kind ?? "ALL"} aria-label="Filter by type" className="w-auto">
          <option value="ALL">All types</option>
          <option value="SUBMISSION">Assignment submissions</option>
          <option value="ANALYSIS">Workspace analyses</option>
        </Select>
        <Select name="status" defaultValue={status ?? "ALL"} aria-label="Filter by status" className="w-auto">
          <option value="ALL">All statuses</option>
          <option value="COMPLETE">Completed</option>
          <option value="PROCESSING">Processing</option>
          <option value="PENDING">Queued</option>
          <option value="FAILED">Failed</option>
        </Select>
        <Select name="sort" defaultValue={sort ?? "newest"} aria-label="Sort" className="w-auto">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest similarity</option>
          <option value="lowest">Lowest similarity</option>
        </Select>
        <button
          type="submit"
          className="focus-ring rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-surface-muted"
        >
          Apply
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title={filtered ? "No reports match those filters" : "No reports yet"}
          description={
            filtered
              ? "Try a different search term, or clear the type and status filters."
              : "Upload an assignment or analyse a document in the workspace, and your reports will collect here."
          }
          action={
            filtered ? (
              <ButtonLink href="/reports" variant="secondary">
                Clear filters
              </ButtonLink>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                <ButtonLink href="/analyse" variant="gradient">
                  <ScanSearch className="size-4" />
                  Analyse a document
                </ButtonLink>
                {user.role === "STUDENT" ? (
                  <ButtonLink href="/student/assignments" variant="secondary">
                    <ClipboardList className="size-4" />
                    Upload an assignment
                  </ButtonLink>
                ) : null}
              </div>
            )
          }
        />
      ) : (
        <ul className="grid gap-3">
          {rows.map((row) => {
            const band = row.riskLevel ? riskBand(row.riskLevel) : null;
            return (
              <li key={`${row.kind}-${row.id}`}>
                <Card className="transition-colors hover:border-border-strong">
                  <div className="flex flex-wrap items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      {row.kind === "SUBMISSION" ? (
                        <ClipboardList className="size-5" />
                      ) : row.fileType === "TEXT" ? (
                        <Type className="size-5" />
                      ) : (
                        <FileText className="size-5" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={row.href}
                        className="focus-ring rounded font-medium hover:text-brand"
                      >
                        {row.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-muted">{row.context}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone={row.kind === "SUBMISSION" ? "accent" : "neutral"}>
                          {row.kind === "SUBMISSION" ? "Submission" : "Analysis"}
                        </Badge>
                        <Badge tone={row.statusTone}>
                          {STATUS_LABEL[row.status as keyof typeof STATUS_LABEL] ?? row.status}
                        </Badge>
                        <Badge tone="neutral">{row.fileType}</Badge>
                        <span className="text-xs text-muted">
                          {formatDate(row.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[11px] tracking-wide text-muted uppercase">
                          Similarity
                        </p>
                        <p
                          className="text-lg font-semibold tabular-nums"
                          style={band ? { color: band.color } : undefined}
                        >
                          {row.similarity === null ? "—" : `${row.similarity}%`}
                        </p>
                        {band ? (
                          <p className="text-[11px] text-muted">{band.label}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] tracking-wide text-muted uppercase">
                          Writing
                        </p>
                        <p className="text-lg font-semibold tabular-nums">
                          {row.writingScore === null ? "—" : Math.round(row.writingScore)}
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full gap-2 sm:w-auto">
                      <ButtonLink href={row.href} variant="secondary" className="flex-1 sm:flex-none">
                        View report
                      </ButtonLink>
                      {row.downloadHref ? (
                        <ButtonLink
                          href={row.downloadHref}
                          variant="ghost"
                          aria-label={`Download ${row.title}`}
                        >
                          <Download className="size-4" />
                        </ButtonLink>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {user.role === "STUDENT" ? (
        <Card className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Looking for feedback from classmates rather than from Lume AI?
            </p>
            <ButtonLink href="/student/peer-review" variant="secondary">
              <Users className="size-4" />
              Peer review
            </ButtonLink>
          </div>
        </Card>
      ) : null}
    </>
  );
}
