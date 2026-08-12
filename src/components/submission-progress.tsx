"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { Alert, Button, Card, cn } from "@/components/ui";
import { LumeMark } from "@/components/brand";

type Status = "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";

const STEPS = [
  { key: "PENDING", label: "Uploaded and queued" },
  { key: "PROCESSING", label: "Extracting text, embedding and comparing" },
  { key: "COMPLETE", label: "Report ready" },
] as const;

/**
 * Live status for a submission while the pipeline runs. Polls the real status
 * rather than animating a guess, and refreshes the page once the report exists.
 */
export function SubmissionProgress({
  submissionId,
  initialStatus,
  initialDetail,
}: {
  submissionId: string;
  initialStatus: Status;
  initialDetail: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [detail, setDetail] = useState<string | null>(initialDetail);

  useEffect(() => {
    if (status === "COMPLETE" || status === "FAILED") return;

    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/submissions/${submissionId}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          status: Status;
          statusDetail: string | null;
        };
        if (cancelled) return;

        setStatus(data.status);
        setDetail(data.statusDetail);

        if (data.status === "COMPLETE" || data.status === "FAILED") {
          clearInterval(timer);
          router.refresh();
        }
      } catch {
        // Transient failure — the next tick retries.
      }
    }, 1200);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [submissionId, status, router]);

  if (status === "FAILED") {
    return (
      <Card>
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-risk-critical/10 text-risk-critical">
            <AlertTriangle className="size-6" />
          </span>
          <div>
            <p className="font-medium">This submission could not be analysed</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
              {detail ??
                "Something went wrong while processing your document. Your file is safely stored — you can run the check again, or submit a different version."}
            </p>
          </div>
          <Button variant="secondary" onClick={() => router.refresh()}>
            Refresh
          </Button>
        </div>
      </Card>
    );
  }

  const currentIndex = STEPS.findIndex((step) => step.key === status);

  return (
    <Card>
      <div className="flex flex-col items-center gap-6 py-6">
        <span className="relative flex size-14 items-center justify-center text-brand">
          <span className="pulse-ring absolute inset-0 rounded-full" />
          <LumeMark className="size-12" />
        </span>

        <div className="text-center">
          <p className="font-medium">Analysing your submission</p>
          <p className="mt-1 text-sm text-muted">
            This page updates itself — there is no need to refresh.
          </p>
        </div>

        <ol className="w-full max-w-sm space-y-1" aria-live="polite">
          {STEPS.map((step, index) => {
            const done = currentIndex > index;
            const active = currentIndex === index;
            return (
              <li
                key={step.key}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  active && "bg-brand-soft",
                )}
              >
                <span className="flex size-5 shrink-0 items-center justify-center">
                  {done ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-risk-original/15 text-risk-original">
                      <Check className="size-3" />
                    </span>
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
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        <Alert tone="info">
          The first check after the server starts also loads the embedding model,
          which takes longer than later runs.
        </Alert>
      </div>
    </Card>
  );
}
