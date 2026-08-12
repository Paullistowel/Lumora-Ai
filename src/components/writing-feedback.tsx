import { Badge, Card, CardHeader, Stat } from "./ui";
import type { WritingIssue } from "@/lib/writing";

const CATEGORY_LABEL: Record<string, string> = {
  TONE: "Academic tone",
  PASSIVE_VOICE: "Passive voice",
  WORDINESS: "Wordiness",
  STRUCTURE: "Structure",
  READABILITY: "Readability",
  CITATION: "Citations",
  TRANSITIONS: "Transitions",
  VOCABULARY: "Vocabulary",
};

const SEVERITY_TONE = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
} as const;

export type WritingFeedbackData = {
  readabilityScore: number;
  gradeLevel: number;
  academicToneScore: number;
  overallScore: number;
  issues: WritingIssue[];
  strengths: string[];
};

export function WritingFeedbackPanel({ data }: { data: WritingFeedbackData }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Writing score"
          value={`${data.overallScore}/100`}
          hint={
            data.overallScore >= 80
              ? "Strong"
              : data.overallScore >= 60
                ? "Solid, with fixes"
                : "Needs work"
          }
        />
        <Stat label="Academic tone" value={`${data.academicToneScore}/100`} />
        <Stat
          label="Reading ease"
          value={data.readabilityScore.toFixed(0)}
          hint="40–70 is the academic band"
        />
        <Stat
          label="Grade level"
          value={data.gradeLevel.toFixed(1)}
          hint="Flesch–Kincaid"
        />
      </div>

      {data.strengths.length > 0 ? (
        <Card>
          <CardHeader title="What is working" />
          <ul className="space-y-1.5">
            {data.strengths.map((strength, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span aria-hidden className="text-risk-original">
                  ✓
                </span>
                {strength}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Suggested improvements"
          description={`${data.issues.length} item${data.issues.length === 1 ? "" : "s"} to address, most important first.`}
        />

        {data.issues.length === 0 ? (
          <p className="text-sm text-muted">
            No issues detected — this draft reads well.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.issues.map((issue, i) => (
              <li key={i} className="rounded-lg border border-border p-3">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Badge tone={SEVERITY_TONE[issue.severity]}>
                    {issue.severity.toLowerCase()}
                  </Badge>
                  <span className="text-xs font-medium tracking-wide text-muted uppercase">
                    {CATEGORY_LABEL[issue.category] ?? issue.category}
                  </span>
                </div>

                <p className="text-sm font-medium">{issue.message}</p>
                <p className="mt-1 text-sm text-muted">{issue.suggestion}</p>

                {issue.excerpt ? (
                  <p className="mt-2 border-l-2 border-border pl-3 font-mono text-xs text-muted">
                    {issue.excerpt}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
