"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, ButtonLink, Card } from "@/components/ui";

/**
 * Error boundary inside the signed-in shell. Keeps the sidebar and header in
 * place so a failed page does not look like the whole application fell over.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app route error]", error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-lg">
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-risk-critical/10 text-risk-critical">
          <AlertTriangle className="size-6" />
        </span>
        <div>
          <h1 className="text-lg font-semibold">This page could not be loaded</h1>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
            Something failed while fetching it. Nothing has been changed or lost.
            Try again, or head back to your dashboard.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <ButtonLink href="/analyse" variant="secondary">
            Analysis workspace
          </ButtonLink>
        </div>
        {error.digest ? (
          <p className="text-xs text-muted">
            Reference:{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono">
              {error.digest}
            </code>
          </p>
        ) : null}
      </div>
    </Card>
  );
}
