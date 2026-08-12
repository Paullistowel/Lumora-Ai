"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type FormState } from "../actions";
import { Alert, Button, Field, Input } from "@/components/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<FormState, FormData>(login, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field label="Email">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@university.edu"
        />
      </Field>

      <Field label="Password">
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
