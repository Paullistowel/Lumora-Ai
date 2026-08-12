"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert, Button, Field, Input } from "@/components/ui";
export type SettingsState = { error?: string; success?: string } | null;

type Action = (state: SettingsState, formData: FormData) => Promise<SettingsState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

function Feedback({ state }: { state: SettingsState }) {
  if (state?.error) return <Alert tone="error">{state.error}</Alert>;
  if (state?.success) return <Alert tone="success">{state.success}</Alert>;
  return null;
}

export function ProfileForm({
  action,
  defaultName,
}: {
  action: Action;
  defaultName: string;
}) {
  const [state, formAction] = useActionState<SettingsState, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <Feedback state={state} />
      <Field label="Full name">
        <Input name="fullName" defaultValue={defaultName} required />
      </Field>
      <SubmitButton label="Save profile" />
    </form>
  );
}

export function PasswordForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState<SettingsState, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <Feedback state={state} />
      <Field label="Current password">
        <Input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Field label="New password" hint="At least 8 characters.">
        <Input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      <Field label="Confirm new password">
        <Input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      <SubmitButton label="Change password" />
    </form>
  );
}
