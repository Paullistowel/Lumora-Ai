"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createStaff, type ActionState } from "../actions";
import { Alert, Button, Field, Input, Select } from "@/components/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating…" : "Create account"}
    </Button>
  );
}

export function StaffForm({
  departments,
}: {
  departments: { id: string; name: string; code: string }[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createStaff,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Full name">
        <Input name="fullName" required />
      </Field>

      <Field label="Email">
        <Input name="email" type="email" required />
      </Field>

      <Field label="Role">
        <Select name="role" defaultValue="LECTURER" required>
          <option value="LECTURER">Lecturer</option>
          <option value="ADMIN">Administrator</option>
        </Select>
      </Field>

      <Field label="Department (optional)">
        <Select name="departmentId" defaultValue="">
          <option value="">None</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name} ({department.code})
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Temporary password"
        hint="Share it securely; they can change it in Settings."
      >
        <Input name="password" type="text" minLength={8} required />
      </Field>

      <SubmitButton />
    </form>
  );
}
