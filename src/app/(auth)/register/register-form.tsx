"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerStudent, type FormState } from "../actions";
import { Alert, Button, Field, Input, Select } from "@/components/ui";

const LEVELS = [100, 200, 300, 400, 500, 600];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export function RegisterForm({
  departments,
}: {
  departments: { id: string; name: string; code: string }[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    registerStudent,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field label="Full name">
        <Input name="fullName" autoComplete="name" required />
      </Field>

      <Field label="Email">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@university.edu"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Matric number">
          <Input name="matricNumber" required placeholder="CS/2021/0042" />
        </Field>
        <Field label="Level">
          <Select name="level" defaultValue="100" required>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Department">
        <Select name="departmentId" required defaultValue="">
          <option value="" disabled>
            Select your department
          </option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name} ({department.code})
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" hint="8+ characters, letters and numbers.">
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="Confirm password">
          <Input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>
      </div>

      <SubmitButton />
    </form>
  );
}
