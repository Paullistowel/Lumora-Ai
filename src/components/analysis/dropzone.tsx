"use client";

import { useRef, useState, type DragEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Upload, X } from "lucide-react";
import { Button, cn } from "@/components/ui";
import { formatBytes } from "@/lib/format";

const ACCEPT = ".pdf,.docx,.doc,.txt,.md";
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Drag-and-drop document picker. Validation happens here for immediate
 * feedback and again on the server, which is the check that counts.
 */
export function DropZone({
  file,
  onFile,
  disabled,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function accept(candidate: File | undefined) {
    if (!candidate) return;
    const extension = candidate.name.slice(candidate.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPT.split(",").includes(extension)) {
      setError(`Lume AI cannot read ${extension || "that file"}. Use PDF, DOCX, DOC, TXT or MD.`);
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setError(
        `That file is ${formatBytes(candidate.size)}. The limit is ${formatBytes(MAX_BYTES)}.`,
      );
      return;
    }
    setError(null);
    // Mirror the file onto the real <input> so a dropped file is submitted with
    // the form exactly like a browsed one.
    if (inputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(candidate);
      inputRef.current.files = transfer.files;
    }
    onFile(candidate);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    accept(event.dataTransfer.files[0]);
  }

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {file ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <FileText className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {formatBytes(file.size)} ·{" "}
                {file.name.slice(file.name.lastIndexOf(".") + 1).toUpperCase()} · Ready for
                analysis
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              aria-label={`Remove ${file.name}`}
              className="focus-ring rounded-lg p-2 text-muted transition-colors hover:bg-surface-muted hover:text-risk-critical"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!disabled) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
              dragging
                ? "border-brand bg-brand-soft"
                : "border-border bg-surface-muted/50 hover:border-border-strong",
              disabled && "pointer-events-none opacity-60",
            )}
          >
            <span
              className={cn(
                "mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl transition-transform",
                dragging ? "scale-110 bg-brand text-brand-fg" : "bg-surface text-brand",
              )}
            >
              <Upload className="size-6" />
            </span>
            <p className="font-medium">Drop your academic document here</p>
            <p className="mt-1 text-sm text-muted">PDF, DOCX, DOC, TXT or MD · up to 15MB</p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              className="mt-5"
            >
              Browse files
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        name="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => accept(event.target.files?.[0])}
      />

      {error ? (
        <p role="alert" className="mt-2 text-xs text-risk-critical">
          {error}
        </p>
      ) : null}
    </div>
  );
}
