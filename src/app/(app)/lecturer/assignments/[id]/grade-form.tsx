"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { gradeSubmission, type ActionState } from "../../actions";
import { Button, Input, Textarea } from "@/components/ui";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="px-3 py-1.5 text-xs">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function GradeForm({
  submissionId,
  maxMarks,
  grade,
  feedback,
}: {
  submissionId: string;
  maxMarks: number;
  grade: number | null;
  feedback: string | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    gradeSubmission,
    null,
  );
  const [open, setOpen] = useState(false);

  return (
    <form action={formAction} className="space-y-1.5">
      <input type="hidden" name="submissionId" value={submissionId} />

      <div className="flex items-center gap-1.5">
        <Input
          name="grade"
          type="number"
          min={0}
          max={maxMarks}
          step="0.5"
          defaultValue={grade ?? ""}
          aria-label={`Mark out of ${maxMarks}`}
          className="w-20 px-2 py-1 text-sm"
        />
        <span className="text-xs text-muted">/{maxMarks}</span>
        <SaveButton />
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="text-xs text-muted hover:text-brand"
      >
        {open ? "Hide comment" : feedback ? "Edit comment" : "Add comment"}
      </button>

      {open ? (
        <Textarea
          name="feedback"
          rows={3}
          defaultValue={feedback ?? ""}
          placeholder="Feedback for the student"
          className="min-h-0 text-sm"
        />
      ) : (
        <input type="hidden" name="feedback" value={feedback ?? ""} />
      )}

      {state?.error ? (
        <p className="text-xs text-risk-critical">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="text-xs text-risk-original">{state.success}</p>
      ) : null}
    </form>
  );
}
