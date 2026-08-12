"use client";

import { useActionState, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { submitAssignment, type ActionState } from "../../actions";
import { DropZone } from "@/components/analysis/dropzone";
import { Alert, Button } from "@/components/ui";

export function UploadForm({ assignmentId }: { assignmentId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    submitAssignment,
    null,
  );
  const [file, setFile] = useState<File | null>(null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <input type="hidden" name="assignmentId" value={assignmentId} />

      <DropZone file={file} onFile={setFile} disabled={pending} />

      <Button
        type="submit"
        variant="gradient"
        className="w-full"
        disabled={!file || pending}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Uploading…
          </>
        ) : (
          <>
            <UploadCloud className="size-4" /> Submit assignment
          </>
        )}
      </Button>

      <p className="text-xs text-muted">
        Your document is checked against your classmates&apos; submissions for this
        assignment and analysed for academic writing quality. You will be taken
        to the report as soon as it is uploaded — analysis continues in the
        background and the page updates itself when it finishes.
      </p>
    </form>
  );
}
