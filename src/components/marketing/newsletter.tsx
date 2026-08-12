"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "motion/react";
import { ArrowRight, Check, Mail } from "lucide-react";
import { subscribeToNewsletter } from "@/app/(marketing)/actions";
import type { PublicFormState } from "@/lib/form-state";
import { Alert, Select, cn } from "../ui";

function SubmitButton({ compact }: { compact?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "focus-ring group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand font-medium text-brand-fg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60",
        compact ? "px-4 py-2.5 text-sm" : "px-5 py-3 text-sm",
      )}
    >
      {pending ? "Subscribing…" : "Subscribe"}
      {!pending ? (
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      ) : null}
    </button>
  );
}

/**
 * Newsletter sign-up. `variant="inline"` is the compact footer form;
 * `variant="panel"` is the full-width call-to-action block.
 */
export function NewsletterForm({
  source = "footer",
  variant = "inline",
}: {
  source?: string;
  variant?: "inline" | "panel";
}) {
  const [state, formAction] = useActionState<PublicFormState, FormData>(
    subscribeToNewsletter,
    null,
  );

  if (state?.success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex items-center gap-3 rounded-xl border border-risk-original/30 bg-risk-original/10 px-4 py-3"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-risk-original text-white">
          <Check className="size-4" />
        </span>
        <p className="text-sm font-medium text-risk-original">{state.success}</p>
      </motion.div>
    );
  }

  if (variant === "panel") {
    return (
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="source" value={source} />
        {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="sr-only">Name</span>
            <input
              name="name"
              placeholder="Your name (optional)"
              autoComplete="name"
              className="focus-ring w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm placeholder:text-muted"
            />
          </label>
          <label className="block">
            <span className="sr-only">Role</span>
            <Select name="role" defaultValue="" className="py-3">
              <option value="">I am a…</option>
              <option value="STUDENT">Student</option>
              <option value="LECTURER">Lecturer</option>
              <option value="ADMINISTRATOR">Administrator</option>
              <option value="OTHER">Something else</option>
            </Select>
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Email address</span>
            <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
            <input
              name="email"
              type="email"
              required
              placeholder="you@university.edu"
              autoComplete="email"
              className="focus-ring w-full rounded-xl border border-border bg-surface py-3 pr-4 pl-11 text-sm placeholder:text-muted"
            />
          </label>
          <SubmitButton />
        </div>

        <p className="text-xs text-muted">
          One email a month on academic integrity research and product changes.
          Unsubscribe in a click — we never sell or share your address.
        </p>
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="source" value={source} />
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Email address</span>
          <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            name="email"
            type="email"
            required
            placeholder="you@university.edu"
            autoComplete="email"
            className="focus-ring w-full rounded-xl border border-border bg-surface py-2.5 pr-3 pl-10 text-sm placeholder:text-muted"
          />
        </label>
        <SubmitButton compact />
      </div>
      {state?.error ? (
        <p className="text-xs text-risk-critical">{state.error}</p>
      ) : (
        <p className="text-xs text-muted">Monthly. No spam. Unsubscribe anytime.</p>
      )}
    </form>
  );
}
