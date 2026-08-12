"use client";

import { useActionState, useState } from "react";
import { Loader2, Send, Star, ThumbsUp, Wrench } from "lucide-react";
import {
  submitDocumentReview,
  type ReviewActionState,
} from "@/app/(app)/student/peer-review/actions";
import { Alert, Button, Card, CardHeader, Textarea, cn } from "@/components/ui";

const CRITERIA = [
  { key: "content", label: "Content", hint: "Is the argument substantive, accurate and well supported?" },
  { key: "organization", label: "Organization", hint: "Does it move logically from introduction through body to conclusion?" },
  { key: "clarity", label: "Clarity", hint: "Can you follow it on one reading?" },
  { key: "grammar", label: "Grammar & style", hint: "Is the writing correct and appropriately academic?" },
  { key: "research", label: "Research & references", hint: "Are claims attributed, and do the sources do real work?" },
  { key: "originality", label: "Originality", hint: "Does it contribute a view of its own?" },
] as const;

const MAX = 5;
const SCALE_LABEL = ["", "Poor", "Weak", "Adequate", "Strong", "Excellent"];

function Rating({
  name,
  value,
  onChange,
  label,
}: {
  name: string;
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div
      role="radiogroup"
      aria-label={`${label} rating out of ${MAX}`}
      className="flex items-center gap-1"
      onMouseLeave={() => setHovered(0)}
    >
      {Array.from({ length: MAX }, (_, i) => i + 1).map((score) => (
        <button
          key={score}
          type="button"
          role="radio"
          aria-checked={value === score}
          aria-label={`${score} out of ${MAX} — ${SCALE_LABEL[score]}`}
          onClick={() => onChange(score)}
          onMouseEnter={() => setHovered(score)}
          className="focus-ring rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "size-5 transition-colors",
              score <= shown
                ? "fill-risk-moderate text-risk-moderate"
                : "text-border-strong",
            )}
          />
        </button>
      ))}
      <span className="ml-2 min-w-[5.5rem] text-xs text-muted">
        {shown ? SCALE_LABEL[shown] : "Not rated"}
      </span>
      <input type="hidden" name={name} value={value || ""} />
    </div>
  );
}

export function DocumentReviewForm({ reviewId }: { reviewId: string }) {
  const [state, formAction, pending] = useActionState<ReviewActionState, FormData>(
    submitDocumentReview,
    null,
  );

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");

  const rated = CRITERIA.filter((c) => ratings[c.key]).length;
  const complete =
    rated === CRITERIA.length &&
    strengths.trim().length >= 20 &&
    improvements.trim().length >= 20;

  const average =
    rated > 0
      ? (
          CRITERIA.reduce((sum, c) => sum + (ratings[c.key] ?? 0), 0) / rated
        ).toFixed(1)
      : null;

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="reviewId" value={reviewId} />

      <Card>
        <CardHeader
          title="Rate the work"
          description="Five stars is excellent, one is poor. Rate all six before submitting."
          action={
            average ? (
              <span className="text-sm font-semibold tabular-nums">
                {average} / {MAX}
              </span>
            ) : null
          }
        />
        <ul className="space-y-3">
          {CRITERIA.map((criterion) => (
            <li
              key={criterion.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{criterion.label}</p>
                <p className="mt-0.5 text-xs text-muted">{criterion.hint}</p>
              </div>
              <Rating
                name={`rating_${criterion.key}`}
                label={criterion.label}
                value={ratings[criterion.key] ?? 0}
                onChange={(value) =>
                  setRatings((current) => ({ ...current, [criterion.key]: value }))
                }
              />
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader
          title="What is working?"
          description="Point at something specific — a paragraph, an argument, a choice of evidence."
          icon={<ThumbsUp className="size-4" />}
        />
        <Textarea
          name="strengths"
          value={strengths}
          onChange={(event) => setStrengths(event.target.value)}
          placeholder="e.g. The framing in the introduction is clear, and the second body paragraph supports its claim with a well-chosen source rather than an assertion."
          className="min-h-28"
          required
        />
        <p className="mt-1.5 text-xs text-muted">
          {strengths.trim().length < 20
            ? `${20 - strengths.trim().length} more characters needed`
            : `${strengths.trim().length} characters`}
        </p>
      </Card>

      <Card>
        <CardHeader
          title="What would you change?"
          description="At least one concrete, actionable suggestion."
          icon={<Wrench className="size-4" />}
        />
        <Textarea
          name="improvements"
          value={improvements}
          onChange={(event) => setImprovements(event.target.value)}
          placeholder="e.g. Section 3 asserts that detection improves outcomes but cites nothing — either attribute it or soften the claim. The conclusion restates the introduction; it could instead say what follows from the argument."
          className="min-h-28"
          required
        />
        <p className="mt-1.5 text-xs text-muted">
          {improvements.trim().length < 20
            ? `${20 - improvements.trim().length} more characters needed`
            : `${improvements.trim().length} characters`}
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Anything else?"
          description="Optional — overall impression, or a question for the author."
        />
        <Textarea
          name="comment"
          placeholder="Optional."
          className="min-h-20"
        />
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="gradient"
          disabled={!complete || pending}
          className="px-6 py-3"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <Send className="size-4" /> Submit review
            </>
          )}
        </Button>
        {!complete && !pending ? (
          <p className="text-xs text-muted">
            {rated < CRITERIA.length
              ? `Rate all six criteria (${rated}/${CRITERIA.length} done).`
              : "Write at least a sentence or two in both feedback boxes."}
          </p>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        Your review is anonymous to the author. Lume AI scores it for
        specificity and constructiveness — that score is about the review, not
        about you, and it is what stops “good essay” counting as feedback.
      </p>
    </form>
  );
}
