"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import { createRubric, type ActionState } from "../actions";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";

type Row = { key: number; label: string; description: string; maxScore: number; weight: number };

const BLANK = (key: number): Row => ({
  key,
  label: "",
  description: "",
  maxScore: 10,
  weight: 1,
});

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating…" : "Create rubric"}
    </Button>
  );
}

export function RubricForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createRubric,
    null,
  );
  const [rows, setRows] = useState<Row[]>([BLANK(0), BLANK(1)]);
  const [nextKey, setNextKey] = useState(2);

  function addRow() {
    setRows((current) => [...current, BLANK(nextKey)]);
    setNextKey((key) => key + 1);
  }

  function removeRow(key: number) {
    setRows((current) =>
      current.length > 1 ? current.filter((row) => row.key !== key) : current,
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Name">
        <Input name="name" required placeholder="Essay rubric" />
      </Field>

      <Field label="Description (optional)">
        <Textarea name="description" rows={2} className="min-h-0" />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isTemplate" className="size-4" />
        Share as a department template
      </label>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">Criteria</legend>

        {rows.map((row, index) => (
          <div key={row.key} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">
                Criterion {index + 1}
              </span>
              {rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  aria-label={`Remove criterion ${index + 1}`}
                  className="rounded p-1 text-muted hover:text-risk-critical"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </div>

            <Input
              name="criterionLabel"
              required
              placeholder="Argument and analysis"
              className="mb-2"
            />
            <Input
              name="criterionDescription"
              placeholder="Description (optional)"
              className="mb-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted">
                Max score
                <Input
                  name="criterionMax"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={10}
                  className="mt-1"
                />
              </label>
              <label className="text-xs text-muted">
                Weight
                <Input
                  name="criterionWeight"
                  type="number"
                  min={0.1}
                  max={10}
                  step={0.1}
                  defaultValue={1}
                  className="mt-1"
                />
              </label>
            </div>
          </div>
        ))}

        <Button type="button" variant="secondary" onClick={addRow} className="w-full">
          <Plus className="size-4" />
          Add criterion
        </Button>
      </fieldset>

      <SubmitButton />
    </form>
  );
}
