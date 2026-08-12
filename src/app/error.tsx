"use client";

import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { LumeLogo } from "@/components/brand";
import { Button, ButtonLink } from "@/components/ui";

/**
 * Route error boundary.
 *
 * Never renders the thrown message: it can carry internal detail, and to the
 * reader it is noise either way. The digest is shown instead so a report can
 * be tied to a server log line.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      <div className="aurora" aria-hidden />

      <div className="relative max-w-md">
        <LumeLogo className="mb-8 justify-center" />

        <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-risk-critical/10 text-risk-critical">
          <AlertTriangle className="size-6" />
        </span>

        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Something went wrong on our side
        </h1>
        <p className="mt-3 text-pretty text-muted">
          This page failed to load. Your work has not been lost — nothing is
          saved or deleted by opening a page. Try again, and if it keeps
          happening, tell us what you were doing.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset} variant="gradient" className="px-5 py-2.5">
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <ButtonLink href="/" variant="secondary" className="px-5 py-2.5">
            <ArrowLeft className="size-4" />
            Back to home
          </ButtonLink>
        </div>

        {error.digest ? (
          <p className="mt-8 text-xs text-muted">
            Reference:{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono">
              {error.digest}
            </code>
          </p>
        ) : null}
      </div>
    </div>
  );
}
