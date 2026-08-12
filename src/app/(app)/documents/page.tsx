import Link from "next/link";
import {
  ClipboardList, Download, FileText, ScanSearch, Trash2, Upload, Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DOCUMENT_STATUS, type DocumentStatus } from "@/lib/review-exchange";
import { deleteAnalysis } from "../analyse/actions";
import {
  deleteReviewDocument, submitExistingForReview,
} from "../student/peer-review/actions";
import {
  Badge, Button, ButtonLink, Card, EmptyState, PageHeader, Stat, Table, Td, Th,
} from "@/components/ui";
import { formatBytes, formatDate } from "@/lib/format";

export const metadata = {
  title: "Documents",
  description:
    "Every file you have uploaded to Lume AI, with what it was used for and what you can do with it.",
};

type Entry = {
  key: string;
  title: string;
  source: "Assignment" | "Analysis" | "Peer review";
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  statusTone: "neutral" | "brand" | "success" | "danger" | "warning";
  createdAt: Date;
  viewHref: string;
  downloadHref: string | null;
  /** Set when this file can be offered up for peer review. */
  shareable: { kind: "submission" | "analysis"; id: string } | null;
  /** Set when the student may delete it. */
  deletable: { kind: "analysis" | "review"; id: string } | null;
};

export default async function DocumentsPage() {
  const user = await requireUser();
  const isStudent = user.role === "STUDENT";

  const [submissions, analyses, reviewDocuments] = await Promise.all([
    isStudent
      ? db.submission.findMany({
          where: { studentId: user.id },
          orderBy: { submittedAt: "desc" },
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            status: true,
            submittedAt: true,
            assignment: {
              select: { title: true, course: { select: { code: true } } },
            },
          },
        })
      : Promise.resolve([]),
    db.analysis.findMany({
      where: { userId: user.id, source: "UPLOAD" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        status: true,
        createdAt: true,
      },
    }),
    isStudent
      ? db.reviewDocument.findMany({
          where: { ownerId: user.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            status: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const entries: Entry[] = [
    ...submissions.map((submission) => ({
      key: `sub-${submission.id}`,
      title: submission.assignment.title,
      source: "Assignment" as const,
      fileName: submission.fileName,
      fileType: submission.fileType.toUpperCase(),
      fileSize: submission.fileSize,
      status: submission.status,
      statusTone:
        submission.status === "COMPLETE"
          ? ("success" as const)
          : submission.status === "FAILED"
            ? ("danger" as const)
            : ("brand" as const),
      createdAt: submission.submittedAt,
      viewHref: `/student/submissions/${submission.id}`,
      downloadHref: `/api/files/submission/${submission.id}`,
      shareable: { kind: "submission" as const, id: submission.id },
      // Submitted coursework is part of an academic record; a student cannot
      // remove it. They can supersede it with a new version instead.
      deletable: null,
    })),
    ...analyses.map((analysis) => ({
      key: `ana-${analysis.id}`,
      title: analysis.title,
      source: "Analysis" as const,
      fileName: analysis.fileName ?? "—",
      fileType: analysis.fileType?.toUpperCase() ?? "—",
      fileSize: analysis.fileSize,
      status: analysis.status,
      statusTone:
        analysis.status === "COMPLETE"
          ? ("success" as const)
          : analysis.status === "FAILED"
            ? ("danger" as const)
            : ("brand" as const),
      createdAt: analysis.createdAt,
      viewHref: `/analyse/${analysis.id}`,
      downloadHref: `/api/files/analysis/${analysis.id}`,
      shareable: isStudent ? { kind: "analysis" as const, id: analysis.id } : null,
      deletable: { kind: "analysis" as const, id: analysis.id },
    })),
    ...reviewDocuments.map((document) => {
      const status = DOCUMENT_STATUS[document.status as DocumentStatus];
      return {
        key: `rev-${document.id}`,
        title: document.title,
        source: "Peer review" as const,
        fileName: document.fileName,
        fileType: document.fileType.toUpperCase(),
        fileSize: document.fileSize,
        status: status?.label ?? document.status,
        statusTone: status?.tone ?? ("neutral" as const),
        createdAt: document.createdAt,
        viewHref: `/student/peer-review/${document.id}`,
        downloadHref: `/api/files/review-document/${document.id}`,
        shareable: null,
        deletable: { kind: "review" as const, id: document.id },
      };
    }),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const totalBytes = entries.reduce((sum, entry) => sum + entry.fileSize, 0);

  return (
    <>
      <PageHeader
        eyebrow="Your files"
        title="Documents"
        description="Every file you have uploaded to Lume AI, and what you can do with each one."
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/analyse" variant="gradient">
              <Upload className="size-4" />
              Upload &amp; analyse
            </ButtonLink>
            {isStudent ? (
              <ButtonLink href="/student/peer-review/new" variant="secondary">
                <Users className="size-4" />
                Submit for review
              </ButtonLink>
            ) : null}
          </div>
        }
      />

      {entries.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Documents" value={entries.length} hint="Files you own" />
          <Stat
            label="Assignment submissions"
            value={submissions.length}
            hint={isStudent ? "Part of your record" : "Not applicable"}
          />
          <Stat label="Workspace uploads" value={analyses.length} hint="Analysed by you" />
          <Stat label="Storage used" value={formatBytes(totalBytes)} hint="On this server" />
        </div>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Anything you upload — an assignment, a draft for analysis, or a document for peer review — appears here."
          action={
            <ButtonLink href="/analyse" variant="gradient">
              <ScanSearch className="size-4" />
              Upload a document
            </ButtonLink>
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Document</Th>
              <Th>Used for</Th>
              <Th>Type</Th>
              <Th>Size</Th>
              <Th>Status</Th>
              <Th>Uploaded</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.key} className="hover:bg-surface-muted/50">
                <Td>
                  <Link
                    href={entry.viewHref}
                    className="focus-ring flex items-center gap-2.5 rounded font-medium hover:text-brand"
                  >
                    {entry.source === "Assignment" ? (
                      <ClipboardList className="size-4 shrink-0 text-muted" />
                    ) : entry.source === "Peer review" ? (
                      <Users className="size-4 shrink-0 text-muted" />
                    ) : (
                      <FileText className="size-4 shrink-0 text-muted" />
                    )}
                    <span className="line-clamp-1">{entry.title}</span>
                  </Link>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {entry.fileName}
                  </span>
                </Td>
                <Td>
                  <Badge
                    tone={
                      entry.source === "Assignment"
                        ? "accent"
                        : entry.source === "Peer review"
                          ? "brand"
                          : "neutral"
                    }
                  >
                    {entry.source}
                  </Badge>
                </Td>
                <Td className="text-muted">{entry.fileType}</Td>
                <Td className="text-muted whitespace-nowrap">
                  {formatBytes(entry.fileSize)}
                </Td>
                <Td>
                  <Badge tone={entry.statusTone}>{entry.status}</Badge>
                </Td>
                <Td className="text-muted whitespace-nowrap">
                  {formatDate(entry.createdAt)}
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <ButtonLink
                      href={entry.viewHref}
                      variant="ghost"
                      className="px-2.5 py-1.5 text-xs"
                    >
                      View
                    </ButtonLink>

                    {entry.downloadHref ? (
                      <ButtonLink
                        href={entry.downloadHref}
                        variant="ghost"
                        aria-label={`Download ${entry.fileName}`}
                        className="px-2 py-1.5"
                      >
                        <Download className="size-3.5" />
                      </ButtonLink>
                    ) : null}

                    {entry.shareable ? (
                      <form
                        action={async () => {
                          "use server";
                          await submitExistingForReview(
                            entry.shareable!.kind,
                            entry.shareable!.id,
                          );
                        }}
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          aria-label={`Submit ${entry.title} for peer review`}
                          className="px-2 py-1.5"
                        >
                          <Users className="size-3.5" />
                        </Button>
                      </form>
                    ) : null}

                    {entry.deletable ? (
                      <form
                        action={async () => {
                          "use server";
                          if (entry.deletable!.kind === "analysis") {
                            await deleteAnalysis(entry.deletable!.id);
                          } else {
                            await deleteReviewDocument(entry.deletable!.id);
                          }
                        }}
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          aria-label={`Delete ${entry.title}`}
                          className="px-2 py-1.5 hover:text-risk-critical"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {isStudent && submissions.length > 0 ? (
        <Card className="mt-5">
          <p className="text-xs text-muted">
            Assignment submissions cannot be deleted — they are part of your
            academic record. Submitting a new version supersedes the old one
            without removing it.
          </p>
        </Card>
      ) : null}
    </>
  );
}
