import { Badge, Card, CardHeader, Stat } from "./ui";
import { riskBand, type RiskLevel } from "@/lib/risk";
import { formatPercent } from "@/lib/format";

export type ReportParagraph = {
  id: string;
  index: number;
  text: string;
  bestScore: number;
  matches: { studentName: string; score: number }[];
};

export type ReportData = {
  overallScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  chunksAnalyzed: number;
  chunksFlagged: number;
  comparedAgainst: number;
  paragraphs: ReportParagraph[];
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const band = riskBand(level);
  return <Badge tone={band.tone}>{band.label}</Badge>;
}

/** Colours a paragraph by its strongest match — the "heatmap" of Module 5. */
function heatColor(score: number) {
  if (score < 0.75) return "transparent";
  if (score < 0.85) return "color-mix(in srgb, var(--risk-moderate) 18%, transparent)";
  if (score < 0.93) return "color-mix(in srgb, var(--risk-high) 22%, transparent)";
  return "color-mix(in srgb, var(--risk-critical) 26%, transparent)";
}

export function SimilarityReport({
  data,
  showSources,
}: {
  data: ReportData;
  /** Students see anonymised sources; lecturers see names. */
  showSources: boolean;
}) {
  const band = riskBand(data.riskLevel);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Overall similarity"
          value={formatPercent(data.overallScore)}
          hint={band.label}
          tone={band.color}
        />
        <Stat
          label="Flagged paragraphs"
          value={`${data.chunksFlagged}/${data.chunksAnalyzed}`}
          hint="At or above 75% match"
        />
        <Stat
          label="Compared against"
          value={data.comparedAgainst}
          hint={data.comparedAgainst === 1 ? "peer submission" : "peer submissions"}
        />
        <Stat
          label="Confidence"
          value={formatPercent(data.confidence * 100, 0)}
          hint={
            data.confidence === 0
              ? "No corpus to compare"
              : data.confidence < 0.6
                ? "Short document"
                : "Sufficient text"
          }
        />
      </div>

      {data.comparedAgainst === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            No other submissions exist for this assignment yet, so a 0% score is
            not yet evidence of originality. The report updates automatically as
            classmates submit.
          </p>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Paragraph heatmap"
          description="Highlighted paragraphs closely match text in another submission."
        />

        <div className="space-y-2">
          {data.paragraphs.map((paragraph) => {
            const flagged = paragraph.bestScore >= 0.75;
            return (
              <div
                key={paragraph.id}
                className="rounded-lg border border-border p-3"
                style={{ background: heatColor(paragraph.bestScore) }}
              >
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted">
                    Paragraph {paragraph.index + 1}
                  </span>
                  {flagged ? (
                    <span className="text-xs font-semibold tabular-nums">
                      {formatPercent(paragraph.bestScore * 100, 0)} match
                    </span>
                  ) : (
                    <span className="text-xs text-muted">No match</span>
                  )}
                </div>

                <p className="text-sm leading-relaxed">
                  {paragraph.text.length > 420
                    ? `${paragraph.text.slice(0, 420)}…`
                    : paragraph.text}
                </p>

                {flagged && paragraph.matches.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5 border-t border-border/60 pt-2">
                    {paragraph.matches.slice(0, 5).map((match, i) => (
                      <li key={i}>
                        <Badge tone="neutral">
                          {showSources ? match.studentName : `Source ${i + 1}`} ·{" "}
                          {formatPercent(match.score * 100, 0)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}

          {data.paragraphs.length === 0 ? (
            <p className="text-sm text-muted">No paragraphs were analysed.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
