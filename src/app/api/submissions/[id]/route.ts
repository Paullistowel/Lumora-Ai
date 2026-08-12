import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Processing status for a submission, so the report page can update itself
 * while the pipeline runs instead of asking the student to refresh.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const submission = await db.submission.findUnique({
    where: { id },
    select: {
      status: true,
      statusDetail: true,
      studentId: true,
      assignment: { select: { course: { select: { lecturerId: true } } } },
    },
  });

  const allowed =
    submission &&
    (submission.studentId === user.id ||
      user.role === "ADMIN" ||
      (user.role === "LECTURER" &&
        submission.assignment.course.lecturerId === user.id));

  if (!submission || !allowed) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  return NextResponse.json(
    { status: submission.status, statusDetail: submission.statusDetail },
    { headers: { "Cache-Control": "no-store" } },
  );
}
