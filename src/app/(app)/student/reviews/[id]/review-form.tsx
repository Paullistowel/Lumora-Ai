"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitPeerReview, type ActionState } from "../../actions";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";

type Criterion = {
  id: string;
  label: string;
  description: string | null;
  maxScore: number;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Submitting…" : "Submit review"}
    </Button>
  );
}

export function ReviewForm({
  reviewId,
  criteria,
}: {
  reviewId: string;
  criteria: Criterion[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    submitPeerReview,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <input type="hidden" name="reviewId" value={reviewId} />

      {criteria.map((criterion) => (
        <div key={criterion.id} className="rounded-lg border border-border p-3">
          <Field
            label={`${criterion.label} (0–${criterion.maxScore})`}
            hint={criterion.description ?? undefined}
          >
            <Input
              name={`score_${criterion.id}`}
              type="number"
              min={0}
              max={criterion.maxScore}
              step={1}
              required
              defaultValue=""
            />
          </Field>
          <div className="mt-2">
            <Textarea
              name={`comment_${criterion.id}`}
              rows={2}
              placeholder="Optional note on this criterion"
              className="min-h-0"
            />
          </div>
        </div>
      ))}

      <Field
        label="Overall feedback"
        hint="Name the section you mean and suggest a concrete improvement."
      >
        <Textarea
          name="comment"
          rows={8}
          required
          minLength={20}
          placeholder="The introduction states the objective before the research problem. Consider opening with the gap in the literature, then narrowing to your objective…"
        />
      </Field>

      <SubmitButton />

      <p className="text-xs text-muted">
        Your feedback is shared anonymously with the author. It is scored for
        depth, specificity, constructiveness and tone.
      </p>
    </form>
  );
}
