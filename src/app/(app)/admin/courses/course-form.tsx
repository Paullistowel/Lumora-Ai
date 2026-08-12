"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCourse, type ActionState } from "../actions";
import { Alert, Button, Field, Input, Select } from "@/components/ui";

const LEVELS = [100, 200, 300, 400, 500, 600];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating…" : "Create course"}
    </Button>
  );
}

export function CourseForm({
  departments,
  lecturers,
}: {
  departments: { id: string; name: string; code: string }[];
  lecturers: { id: string; fullName: string }[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createCourse,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Title">
        <Input name="title" required placeholder="Research Methods" />
      </Field>

      <Field label="Code">
        <Input name="code" required placeholder="CSC401" maxLength={16} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Level">
          <Select name="level" defaultValue="100" required>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Semester">
          <Select name="semester" defaultValue="First" required>
            <option value="First">First</option>
            <option value="Second">Second</option>
          </Select>
        </Field>
      </div>

      <Field label="Department">
        <Select name="departmentId" required defaultValue={departments[0]?.id}>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name} ({department.code})
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Lecturer (optional)">
        <Select name="lecturerId" defaultValue="">
          <option value="">Unassigned</option>
          {lecturers.map((lecturer) => (
            <option key={lecturer.id} value={lecturer.id}>
              {lecturer.fullName}
            </option>
          ))}
        </Select>
      </Field>

      <SubmitButton />
    </form>
  );
}
