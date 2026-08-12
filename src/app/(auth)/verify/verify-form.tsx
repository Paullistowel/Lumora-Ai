"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { verifyEmail, type FormState } from "../actions";
import { Alert, Button, Field, Input } from "@/components/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Verifying…" : "Verify and continue"}
    </Button>
  );
}

export function VerifyForm({ email }: { email: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    verifyEmail,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <input type="hidden" name="email" value={email} />

      <Field label="Verification code">
        <Input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          placeholder="000000"
          className="text-center text-lg tracking-[0.4em]"
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
