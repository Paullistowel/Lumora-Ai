"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { UploadCloud } from "lucide-react";
import { submitAssignment, type ActionState } from "../../actions";
import { Alert, Button, Field } from "@/components/ui";
import { formatBytes } from "@/lib/format";

const ACCEPT = ".pdf,.docx,.txt,.md";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Uploading and analysing…" : "Submit"}
    </Button>
  );
}

export function UploadForm({ assignmentId }: { assignmentId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    submitAssignment,
    null,
  );
  const [file, setFile] = useState<File | null>(null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <input type="hidden" name="assignmentId" value={assignmentId} />

      <Field
        label="Document"
        hint="PDF, DOCX, TXT or Markdown. Maximum 15MB."
      >
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface-muted px-4 py-6 text-center transition-colors hover:border-brand">
          <UploadCloud className="size-6 text-muted" aria-hidden />
          <span className="text-sm font-medium">
            {file ? file.name : "Choose a file"}
          </span>
          <span className="text-xs text-muted">
            {file ? formatBytes(file.size) : "or drag it here"}
          </span>
          <input
            type="file"
            name="file"
            accept={ACCEPT}
            required
            className="sr-only"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
      </Field>

      <SubmitButton />

      <p className="text-xs text-muted">
        Your document is checked against your classmates&apos; submissions for
        this assignment and analysed for academic writing quality. Processing
        takes a few seconds.
      </p>
    </form>
  );
}
