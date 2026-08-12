"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { Alert, Button, ButtonLink, Card, cn } from "@/components/ui";
import { LumeMark } from "@/components/brand";

const STAGES = [
  { key: "EXTRACT", label: "Extracting text" },
  { key: "SEGMENT", label: "Detecting paragraphs" },
  { key: "EMBED", label: "Generating embeddings" },
  { key: "COMPARE", label: "Comparing semantic patterns" },
  { key: "WRITING", label: "Analysing academic writing" },
  { key: "REPORT", label: "Preparing report" },
] as const;

type Status = "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";

/**
 * Polls the engine for the stage it is genuinely on. Nothing here is on a
 * timer — a step only ticks over when the backend has moved past it.
 */
export function AnalysisProgress({
  analysisId,
  initialStatus,
  initialStage,
}: {
  analysisId: string;
  initialStatus: Status;
  initialStage: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [stage, setStage] = useState(initialStage);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    if (status === "COMPLETE" || status === "FAILED") return;

    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis/${analysisId}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          status: Status;
          stage: string;
          statusDetail: string | null;
        };
        if (cancelled) return;

        setStage(data.stage);
        setDetail(data.statusDetail);
        setStatus(data.status);

        if (data.status === "COMPLETE" || data.status === "FAILED") {
          clearInterval(timer);
          router.refresh();
        }
      } catch {
        // Transient network failure — the next tick retries.
      }
    }, 900);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [analysisId, status, router]);

  if (status === "FAILED") {
    return (
      <Card>
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-risk-critical/10 text-risk-critical">
            <AlertTriangle className="size-6" />
          </span>
          <div>
            <p className="font-medium">Lume AI could not finish this analysis</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
              {detail ??
                "Something went wrong while processing your document. Nothing has been lost — you can try again."}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/analyse">Start a new analysis</ButtonLink>
            <Button variant="secondary" onClick={() => router.refresh()}>
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <Card>
      <div className="flex flex-col items-center gap-6 py-6">
        <span className="relative flex size-14 items-center justify-center text-brand">
          <span className="pulse-ring absolute inset-0 rounded-full" />
          <LumeMark className="size-12" />
        </span>

        <div className="text-center">
          <p className="font-medium">Analysing your document</p>
          <p className="mt-1 text-sm text-muted">
            Everything runs locally on this server. Your work is not sent anywhere.
          </p>
        </div>

        <ol className="w-full max-w-sm space-y-1" aria-live="polite">
          {STAGES.map((entry, index) => {
            const done = currentIndex > index || status === "COMPLETE";
            const active = currentIndex === index && status !== "COMPLETE";
            return (
              <li
                key={entry.key}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  active && "bg-brand-soft",
                )}
              >
                <span className="flex size-5 shrink-0 items-center justify-center">
                  {done ? (
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex size-5 items-center justify-center rounded-full bg-risk-original/15 text-risk-original"
                    >
                      <Check className="size-3" />
                    </motion.span>
                  ) : active ? (
                    <Loader2 className="size-4 animate-spin text-brand" />
                  ) : (
                    <span className="size-2 rounded-full bg-border-strong" />
                  )}
                </span>
                <span
                  className={cn(
                    done ? "text-foreground" : active ? "font-medium text-brand" : "text-muted",
                  )}
                >
                  {entry.label}
                </span>
              </li>
            );
          })}
        </ol>

        <Alert tone="info">
          The first analysis on a fresh server also loads the embedding model,
          which takes longer than subsequent runs.
        </Alert>
      </div>
    </Card>
  );
}
