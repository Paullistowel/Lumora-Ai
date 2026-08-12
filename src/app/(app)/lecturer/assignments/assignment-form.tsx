"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createAssignment, type ActionState } from "../actions";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Publishing…" : "Publish assignment"}
    </Button>
  );
}

export function AssignmentForm({
  courses,
  rubrics,
}: {
  courses: { id: string; code: string; title: string }[];
  rubrics: { id: string; name: string; _count: { criteria: number } }[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createAssignment,
    null,
  );
  const [peerReview, setPeerReview] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field label="Course">
        <Select name="courseId" required defaultValue={courses[0]?.id}>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} — {course.title}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Title">
        <Input name="title" required placeholder="Literature review" />
      </Field>

      <Field label="Instructions">
        <Textarea
          name="instructions"
          rows={5}
          required
          placeholder="Write a 1,500-word review of recent work on…"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Due date">
          <Input name="dueAt" type="datetime-local" required />
        </Field>
        <Field label="Maximum marks">
          <Input
            name="maxMarks"
            type="number"
            min={1}
            max={1000}
            defaultValue={100}
            required
          />
        </Field>
      </div>

      <Field
        label="Similarity threshold (%)"
        hint="Submissions at or above this are flagged on your dashboard."
      >
        <Input
          name="similarityThreshold"
          type="number"
          min={1}
          max={100}
          defaultValue={30}
          required
        />
      </Field>

      <Field label="Marking rubric (optional)">
        <Select name="rubricId" defaultValue="">
          <option value="">No rubric</option>
          {rubrics.map((rubric) => (
            <option key={rubric.id} value={rubric.id}>
              {rubric.name} ({rubric._count.criteria} criteria)
            </option>
          ))}
        </Select>
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="allowLate" defaultChecked className="size-4" />
        Accept late submissions
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="peerReviewEnabled"
          className="size-4"
          checked={peerReview}
          onChange={(event) => setPeerReview(event.target.checked)}
        />
        Enable anonymous peer review
      </label>

      {peerReview ? (
        <div className="grid gap-4 rounded-lg border border-border p-3 sm:grid-cols-2">
          <Field label="Reviewers per student">
            <Input
              name="reviewersPerStudent"
              type="number"
              min={1}
              max={5}
              defaultValue={2}
            />
          </Field>
          <Field label="Review deadline">
            <Input name="reviewDueAt" type="datetime-local" />
          </Field>
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
