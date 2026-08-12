"use client";

import { useActionState, useState } from "react";
import { Loader2, Upload, Users } from "lucide-react";
import { submitForPeerReview, type ReviewActionState } from "@/app/(app)/student/peer-review/actions";
import { DropZone } from "@/components/analysis/dropzone";
import {
  Alert, Button, Card, CardHeader, Field, Input, Select, Textarea,
} from "@/components/ui";

export function PeerReviewUploadForm({
  courses,
}: {
  courses: { id: string; code: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState<ReviewActionState, FormData>(
    submitForPeerReview,
    null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");

  const ready = file !== null && title.trim().length > 0;

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Card>
        <CardHeader
          title="1 · Your document"
          description="The file your reviewers will read. PDF, DOCX, DOC, TXT or Markdown."
          icon={<Upload className="size-4" />}
        />
        <DropZone file={file} onFile={setFile} disabled={pending} />
      </Card>

      <Card>
        <CardHeader
          title="2 · What is it, and what do you want back?"
          description="Reviewers see this before they read. The clearer the ask, the more useful the feedback."
        />
        <div className="space-y-4">
          <Field label="Title" hint="What is this piece of work called?">
            <Input
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Literature review — semantic detection methods"
              maxLength={160}
              required
            />
          </Field>

          <Field
            label="Course"
            hint="Optional. Attaching a course means classmates on it are asked first."
          >
            <Select name="courseId" defaultValue="">
              <option value="">Not course-specific</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} — {course.title}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="What would you like reviewers to focus on?"
            hint="Optional, but a specific ask gets a far more specific answer."
          >
            <Textarea
              name="description"
              placeholder="e.g. I am not sure the argument in section 3 follows from the evidence, and I think the conclusion repeats the introduction."
              className="min-h-28"
              maxLength={2000}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="3 · How many reviews?"
          description="Lume AI asks classmates who have put their own work up first, so the exchange stays reciprocal."
          icon={<Users className="size-4" />}
        />
        <Field label="Reviews requested" hint="Between 1 and 5.">
          <Select name="reviewsRequested" defaultValue="2">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} review{n === 1 ? "" : "s"}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="gradient"
          disabled={!ready || pending}
          className="px-6 py-3"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="size-4" /> Submit for peer review
            </>
          )}
        </Button>
        {!ready && !pending ? (
          <p className="text-xs text-muted">
            {file === null
              ? "Add a document to continue."
              : "Give your document a title to continue."}
          </p>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        Peer review is double-blind. Reviewers never see who wrote the document,
        and you never see who reviewed it.
      </p>
    </form>
  );
}
