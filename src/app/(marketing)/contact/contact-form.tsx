"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "motion/react";
import { Check, Send } from "lucide-react";
import { sendContactMessage } from "../actions";
import type { PublicFormState } from "@/lib/form-state";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";

const TOPICS = [
  "Institutional licensing",
  "Pilot in one department",
  "On-premise deployment",
  "Technical question",
  "Accessibility or data request",
  "Something else",
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gradient" disabled={pending} className="w-full py-3">
      {pending ? "Sending…" : (<><Send className="size-4" /> Send message</>)}
    </Button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState<PublicFormState, FormData>(
    sendContactMessage,
    null,
  );

  if (state?.success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="rounded-2xl border border-risk-original/30 bg-risk-original/10 p-8 text-center"
      >
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-risk-original text-white">
          <Check className="size-6" />
        </span>
        <h2 className="text-lg font-semibold text-risk-original">Message received</h2>
        <p className="mt-2 text-sm text-muted">{state.success}</p>
      </motion.div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <Input name="name" required autoComplete="name" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
      </div>

      <Field label="Institution" hint="Optional, but it helps us answer usefully.">
        <Input name="institution" autoComplete="organization" />
      </Field>

      <Field label="What's this about?">
        <Select name="topic" required defaultValue={TOPICS[0]}>
          {TOPICS.map((topic) => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </Select>
      </Field>

      <Field label="Message">
        <Textarea
          name="message"
          rows={6}
          required
          minLength={20}
          placeholder="Tell us what you're trying to do and where you're stuck."
        />
      </Field>

      <SubmitButton />

      <p className="text-xs text-muted">
        We use what you send here only to reply. See our{" "}
        <a href="/privacy" className="font-medium text-brand hover:underline">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}
