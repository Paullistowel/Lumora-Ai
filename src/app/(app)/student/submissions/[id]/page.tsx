import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  PageHeader,
} from "@/components/ui";
import { Download, RefreshCw, Sparkles, SpellCheck } from "lucide-react";
import { SubmissionProgress } from "@/components/submission-progress";
import { SimilarityReport, type ReportParagraph } from "@/components/similarity-report";
import { WritingFeedbackPanel } from "@/components/writing-feedback";
import type { WritingIssue } from "@/lib/writing";
import type { RiskLevel } from "@/lib/risk";
import { formatBytes, formatDateTime } from "@/lib/format";
import { recheckSubmission } from "../../actions";

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("STUDENT");

  const submission = await db.submission.findUnique({
    where: { id },
    select: {
      id: true,
      studentId: true,
      version: true,
      isLate: true,
      isLatest: true,
      status: true,
      statusDetail: true,
      fileName: true,
      fileSize: true,
      wordCount: true,
      submittedAt: true,
      grade: true,
      feedback: true,
      assignment: {
        select: {
          id: true,
          title: true,
          maxMarks: true,
          course: { select: { code: true, title: true } },
        },
      },
      similarityResult: {
        select: {
          overallScore: true,
          riskLevel: true,
          confidence: true,
          chunksAnalyzed: true,
          chunksFlagged: true,
          comparedAgainst: true,
          matches: {
            select: {
              score: true,
              sourceChunkId: true,
              targetChunk: {
                select: {
                  submission: { select: { student: { select: { fullName: true } } } },
                },
              },
            },
          },
        },
      },
      writingFeedback: true,
      chunks: {
        orderBy: { index: "asc" },
        select: { id: true, index: true, text: true },
      },
      reviewsReceived: {
        where: { status: "SUBMITTED" },
        select: {
          id: true,
          comment: true,
          totalScore: true,
          submittedAt: true,
          scores: {
            select: {
              score: true,
              comment: true,
              criterion: { select: { label: true, maxScore: true } },
            },
          },
        },
      },
    },
  });

  if (!submission || submission.studentId !== user.id) notFound();

  // Fold the flat match rows back onto their paragraphs for the heatmap.
  const matchesByChunk = new Map<string, ReportParagraph["matches"]>();
  for (const match of submission.similarityResult?.matches ?? []) {
    const list = matchesByChunk.get(match.sourceChunkId) ?? [];
    list.push({
      studentName: match.targetChunk.submission.student.fullName,
      score: match.score,
    });
    matchesByChunk.set(match.sourceChunkId, list);
  }

  const paragraphs: ReportParagraph[] = submission.chunks.map((chunk) => {
    const matches = (matchesByChunk.get(chunk.id) ?? []).sort(
      (a, b) => b.score - a.score,
    );
    return {
      id: chunk.id,
      index: chunk.index,
      text: chunk.text,
      bestScore: matches[0]?.score ?? 0,
      matches,
    };
  });

  return (
    <>
      <PageHeader
        title={submission.assignment.title}
        description={`${submission.assignment.course.code} · version ${submission.version} · ${formatDateTime(submission.submittedAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink
              href={`/api/files/submission/${submission.id}`}
              variant="secondary"
            >
              <Download className="size-4" />
              Download
            </ButtonLink>
            <form action={recheckSubmission}>
              <input type="hidden" name="submissionId" value={submission.id} />
              <Button type="submit" variant="secondary">
                <RefreshCw className="size-4" />
                Recheck
              </Button>
            </form>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{submission.fileName}</Badge>
        <Badge tone="neutral">{formatBytes(submission.fileSize)}</Badge>
        <Badge tone="neutral">{submission.wordCount} words</Badge>
        {submission.isLate ? <Badge tone="warning">Late</Badge> : null}
        {!submission.isLatest ? (
          <Badge tone="neutral">Superseded by a newer version</Badge>
        ) : null}
        {submission.grade !== null ? (
          <Badge tone="success">
            Graded {submission.grade}/{submission.assignment.maxMarks}
          </Badge>
        ) : null}
      </div>

      {submission.status === "PENDING" ||
      submission.status === "PROCESSING" ||
      submission.status === "FAILED" ? (
        <div className="mb-5">
          <SubmissionProgress
            submissionId={submission.id}
            initialStatus={submission.status as "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED"}
            initialDetail={submission.statusDetail}
          />
        </div>
      ) : null}

      {submission.grade !== null && submission.feedback ? (
        <div className="mb-5">
          <Card>
            <CardHeader
              title="Lecturer feedback"
              action={
                <Badge tone="success">
                  {submission.grade}/{submission.assignment.maxMarks}
                </Badge>
              }
            />
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {submission.feedback}
            </p>
          </Card>
        </div>
      ) : null}

      {submission.similarityResult ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Originality report
          </h2>
          <SimilarityReport
            showSources={false}
            data={{
              overallScore: submission.similarityResult.overallScore,
              riskLevel: submission.similarityResult.riskLevel as RiskLevel,
              confidence: submission.similarityResult.confidence,
              chunksAnalyzed: submission.similarityResult.chunksAnalyzed,
              chunksFlagged: submission.similarityResult.chunksFlagged,
              comparedAgainst: submission.similarityResult.comparedAgainst,
              paragraphs,
            }}
          />
        </section>
      ) : null}

      {submission.writingFeedback ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Writing feedback
          </h2>
          <WritingFeedbackPanel
            data={{
              readabilityScore: submission.writingFeedback.readabilityScore,
              gradeLevel: submission.writingFeedback.gradeLevel,
              academicToneScore: submission.writingFeedback.academicToneScore,
              overallScore: submission.writingFeedback.overallScore,
              issues: JSON.parse(submission.writingFeedback.issues) as WritingIssue[],
              strengths: JSON.parse(submission.writingFeedback.strengths) as string[],
            }}
          />
        </section>
      ) : null}

      {submission.writingFeedback ? (
        <section className="mb-8">
          <Card>
            <CardHeader
              title="Work on this draft"
              description="Both tools run in your browser — paste your text, nothing is uploaded."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <ButtonLink href="/tools/grammar" variant="secondary" className="justify-start py-3">
                <SpellCheck className="size-4 text-brand" />
                <span className="text-left">
                  <span className="block text-sm font-medium">Grammar checker</span>
                  <span className="block text-xs text-muted">
                    Fix the issues above line by line
                  </span>
                </span>
              </ButtonLink>
              <ButtonLink href="/tools/humanizer" variant="secondary" className="justify-start py-3">
                <Sparkles className="size-4 text-accent" />
                <span className="text-left">
                  <span className="block text-sm font-medium">AI-style check</span>
                  <span className="block text-xs text-muted">
                    See how machine-like your prose reads
                  </span>
                </span>
              </ButtonLink>
            </div>
          </Card>
        </section>
      ) : null}

      {submission.reviewsReceived.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Peer feedback
          </h2>
          <div className="space-y-4">
            {submission.reviewsReceived.map((review, i) => (
              <Card key={review.id}>
                <CardHeader
                  title={`Anonymous reviewer ${i + 1}`}
                  description={
                    review.submittedAt ? formatDateTime(review.submittedAt) : undefined
                  }
                  action={
                    review.totalScore !== null ? (
                      <Badge tone="brand">{review.totalScore} pts</Badge>
                    ) : undefined
                  }
                />
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {review.comment}
                </p>
                {review.scores.length > 0 ? (
                  <ul className="mt-4 space-y-2 border-t border-border pt-4">
                    {review.scores.map((score, j) => (
                      <li key={j} className="text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="font-medium">
                            {score.criterion.label}
                          </span>
                          <span className="tabular-nums text-muted">
                            {score.score}/{score.criterion.maxScore}
                          </span>
                        </div>
                        {score.comment ? (
                          <p className="mt-0.5 text-muted">{score.comment}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <Link
        href="/student/submissions"
        className="text-sm font-medium text-brand hover:underline"
      >
        ← All submissions
      </Link>
    </>
  );
}
