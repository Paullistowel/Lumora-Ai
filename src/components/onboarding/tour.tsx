"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import type { Role } from "@/lib/auth";
import { Button, cn } from "../ui";
import { completeOnboarding } from "./actions";

/**
 * A spotlight product tour for first-time users.
 *
 * Each step names a `data-tour` attribute on a real element. The overlay cuts a
 * hole around that element using a box-shadow, so the underlying UI stays
 * visible and recognisable rather than being described in the abstract.
 *
 * A step whose target is not on the current page is skipped automatically —
 * the sidebar is hidden on mobile, so several targets simply do not exist there.
 */

type Step = {
  target: string;
  title: string;
  body: string;
  placement?: "bottom" | "top" | "right" | "left";
};

const STEPS: Record<Role, Step[]> = {
  STUDENT: [
    {
      target: "welcome",
      title: "Welcome to AI-AIMS",
      body: "A two-minute tour of where everything lives. You can skip it and reopen it later from Settings.",
    },
    {
      target: "nav-assignments",
      title: "Your assignments",
      body: "Everything set for the courses you're enrolled in, with deadlines and submission status. Upload a document here and the analysis starts immediately.",
      placement: "right",
    },
    {
      target: "nav-submissions",
      title: "Reports and feedback",
      body: "Every version you've submitted, with its originality score and writing feedback. Open one to see a paragraph-level heatmap of what matched and why.",
      placement: "right",
    },
    {
      target: "nav-reviews",
      title: "Peer review",
      body: "Reviews assigned to you appear here. It's double-blind — you never see whose work you're reviewing, and they never see who wrote the feedback.",
      placement: "right",
    },
    {
      target: "nav-integrity",
      title: "Before you submit",
      body: "What counts as plagiarism, how your score is calculated, and worked citation examples in four styles. Worth ten minutes before your first deadline.",
      placement: "right",
    },
    {
      target: "stat-similarity",
      title: "Your similarity, at a glance",
      body: "A high score is not an accusation — quoted and cited material registers as similar by design. It tells your lecturer where to look, and they decide.",
      placement: "bottom",
    },
    {
      target: "notifications",
      title: "You'll be told when things happen",
      body: "Report ready, review assigned, feedback published, deadline approaching. Nothing important is only visible if you go looking for it.",
      placement: "bottom",
    },
  ],
  LECTURER: [
    {
      target: "welcome",
      title: "Welcome to AI-AIMS",
      body: "A quick tour of the teaching side. You can skip it and reopen it later from Settings.",
    },
    {
      target: "nav-courses",
      title: "Your courses",
      body: "The courses an administrator has assigned to you, and the students enrolled in each. If a course is missing, ask your admin to set you as its lecturer.",
      placement: "right",
    },
    {
      target: "nav-assignments",
      title: "Publishing work",
      body: "Create assignments, set deadlines and late policy, choose a rubric, and set the similarity threshold at which submissions get flagged to you.",
      placement: "right",
    },
    {
      target: "nav-rubrics",
      title: "Rubrics",
      body: "Weighted criteria that drive both peer review and your own marking. Save one as a department template and colleagues can reuse it.",
      placement: "right",
    },
    {
      target: "stat-at-risk",
      title: "Students at risk",
      body: "Submissions at or above each assignment's own threshold. Open one to see the matched paragraphs before you have any conversation about it.",
      placement: "bottom",
    },
  ],
  ADMIN: [
    {
      target: "welcome",
      title: "Welcome to AI-AIMS",
      body: "A quick tour of administration. You can skip it and reopen it later from Settings.",
    },
    {
      target: "nav-departments",
      title: "Start with structure",
      body: "Departments first, then courses inside them. Students can only register once at least one department exists.",
      placement: "right",
    },
    {
      target: "nav-users",
      title: "People",
      body: "Create lecturer and administrator accounts, search every user, and suspend an account — which ends its sessions immediately, not at token expiry.",
      placement: "right",
    },
    {
      target: "nav-audit",
      title: "The audit trail",
      body: "Every sign-in, submission, recheck, grade and administrative action. This is what makes a misconduct finding defensible.",
      placement: "right",
    },
  ],
};

type Rect = { top: number; left: number; width: number; height: number };

export function OnboardingTour({ role }: { role: Role }) {
  const steps = STEPS[role];
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [active, setActive] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Wait a beat so the dashboard has painted and targets exist.
  useEffect(() => {
    const timer = setTimeout(() => setActive(true), 700);
    return () => clearTimeout(timer);
  }, []);

  const measure = useCallback(() => {
    const step = steps[index];
    if (!step) return;

    if (step.target === "welcome") {
      setRect(null);
      return;
    }

    const element = document.querySelector<HTMLElement>(
      `[data-tour="${step.target}"]`,
    );
    if (!element) {
      setRect(null);
      return;
    }

    element.scrollIntoView({ block: "center", behavior: "smooth" });
    const box = element.getBoundingClientRect();
    setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
  }, [index, steps]);

  useLayoutEffect(() => {
    if (!active) return;
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, measure]);

  // Skip past steps whose target isn't rendered on this viewport.
  useEffect(() => {
    if (!active) return;
    const step = steps[index];
    if (!step || step.target === "welcome") return;
    const exists = document.querySelector(`[data-tour="${step.target}"]`);
    if (!exists && index < steps.length - 1) setIndex((i) => i + 1);
  }, [active, index, steps]);

  const finish = useCallback(async () => {
    setFinishing(true);
    setActive(false);
    await completeOnboarding();
  }, []);

  useEffect(() => {
    if (!active) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") void finish();
      if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, steps.length - 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish, steps.length]);

  if (!active || finishing) return null;

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const padding = 8;

  return (
    <AnimatePresence>
      <motion.div
        key="tour"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        {/* Dimmer with a hole cut around the target. */}
        {rect ? (
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="pointer-events-none absolute rounded-xl"
            style={{
              top: rect.top - padding,
              left: rect.left - padding,
              width: rect.width + padding * 2,
              height: rect.height + padding * 2,
              boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.62)",
              outline: "2px solid var(--brand)",
              outlineOffset: 2,
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-black/62" />
        )}

        {/* Click-through blocker */}
        <button
          type="button"
          aria-label="Close tour"
          onClick={finish}
          className="absolute inset-0 cursor-default"
        />

        {/* Card */}
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "absolute w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-lg)]",
            !rect && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          )}
          style={rect ? cardPosition(rect, step.placement) : undefined}
        >
          <div className="h-1 bg-gradient-to-r from-brand via-accent to-accent-2" />

          <div className="p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="text-xs font-semibold tracking-wide text-brand uppercase">
                Step {index + 1} of {steps.length}
              </span>
              <button
                type="button"
                onClick={finish}
                aria-label="Skip tour"
                className="focus-ring -mt-1 -mr-1 rounded-lg p-1 text-muted hover:bg-surface-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <h2 id="tour-title" className="text-base font-semibold">
              {step.title}
            </h2>
            <p className="mt-2 text-sm text-pretty text-muted">{step.body}</p>

            {/* Progress dots */}
            <div className="mt-5 flex items-center gap-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === index ? "w-5 bg-brand" : "w-1.5 bg-border-strong",
                  )}
                />
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2">
              {index > 0 ? (
                <Button
                  variant="secondary"
                  onClick={() => setIndex((i) => i - 1)}
                  className="px-3 py-2 text-sm"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  className="focus-ring rounded-lg px-2 py-2 text-sm text-muted hover:text-foreground"
                >
                  Skip tour
                </button>
              )}

              <Button
                variant="gradient"
                onClick={() => (isLast ? void finish() : setIndex((i) => i + 1))}
                className="ml-auto px-4 py-2 text-sm"
              >
                {isLast ? (<><Check className="size-4" /> Finish</>) : (<>Next <ArrowRight className="size-4" /></>)}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Places the card beside the spotlight, kept inside the viewport. */
function cardPosition(rect: Rect, placement: Step["placement"] = "bottom") {
  const width = 352;
  const gap = 16;
  const margin = 12;

  let top: number;
  let left: number;

  switch (placement) {
    case "right":
      top = rect.top;
      left = rect.left + rect.width + gap;
      break;
    case "left":
      top = rect.top;
      left = rect.left - width - gap;
      break;
    case "top":
      top = rect.top - gap - 260;
      left = rect.left;
      break;
    default:
      top = rect.top + rect.height + gap;
      left = rect.left;
  }

  // Clamp so the card never hangs off-screen on a small window.
  const maxLeft = window.innerWidth - width - margin;
  const maxTop = window.innerHeight - 300;
  left = Math.max(margin, Math.min(left, Math.max(margin, maxLeft)));
  top = Math.max(margin, Math.min(top, Math.max(margin, maxTop)));

  return { top, left };
}
