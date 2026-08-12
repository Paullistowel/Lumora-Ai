"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createDepartment, type ActionState } from "../actions";
import { Alert, Button, Field, Input } from "@/components/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating…" : "Create department"}
    </Button>
  );
}

export function DepartmentForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createDepartment,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Name">
        <Input name="name" required placeholder="Computer Science" />
      </Field>

      <Field label="Code" hint="Short identifier used across the platform.">
        <Input name="code" required placeholder="CSC" maxLength={10} />
      </Field>

      <SubmitButton />
    </form>
  );
}
