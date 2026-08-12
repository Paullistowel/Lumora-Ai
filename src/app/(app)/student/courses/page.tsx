import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { enrol, unenrol } from "../actions";

export const metadata = { title: "Courses · AI-AIMS" };

export default async function CoursesPage() {
  const user = await requireRole("STUDENT");

  const [courses, enrollments] = await Promise.all([
    db.course.findMany({
      // Students see their own department's catalogue.
      where: user.departmentId ? { departmentId: user.departmentId } : undefined,
      orderBy: [{ level: "asc" }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        title: true,
        level: true,
        semester: true,
        lecturer: { select: { fullName: true } },
        _count: { select: { assignments: true, enrollments: true } },
      },
    }),
    db.enrollment.findMany({
      where: { studentId: user.id },
      select: { courseId: true },
    }),
  ]);

  const enrolledIds = new Set(enrollments.map((e) => e.courseId));

  // Which courses this student already has work in — those cannot be withdrawn.
  const submitted = await db.submission.findMany({
    where: { studentId: user.id },
    select: { assignment: { select: { courseId: true } } },
  });
  const coursesWithWork = new Set(submitted.map((s) => s.assignment.courseId));

  return (
    <>
      <PageHeader
        eyebrow="Enrolment"
        title="Courses"
        description="Enrol to receive assignments, deadlines and peer review allocations."
      />

      {courses.length === 0 ? (
        <EmptyState
          title="No courses in your department yet"
          description="An administrator needs to create courses before you can enrol."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => {
            const enrolled = enrolledIds.has(course.id);
            const locked = enrolled && coursesWithWork.has(course.id);
            return (
              <Card key={course.id}>
                <CardHeader
                  title={course.title}
                  description={`${course.code} · Level ${course.level} · ${course.semester}`}
                  action={enrolled ? <Badge tone="success">Enrolled</Badge> : undefined}
                />
                <p className="text-sm text-muted">
                  {course.lecturer?.fullName ?? "No lecturer assigned"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {course._count.assignments} assignment
                  {course._count.assignments === 1 ? "" : "s"} ·{" "}
                  {course._count.enrollments} enrolled
                </p>

                <form
                  action={enrolled ? unenrol : enrol}
                  className="mt-4 border-t border-border pt-4"
                >
                  <input type="hidden" name="courseId" value={course.id} />
                  <Button
                    type="submit"
                    variant={enrolled ? "secondary" : "primary"}
                    className="w-full"
                    // Withdrawing would orphan submitted work.
                    disabled={locked}
                  >
                    {enrolled ? "Withdraw" : "Enrol"}
                  </Button>
                  {locked ? (
                    <p className="mt-2 text-xs text-muted">
                      You cannot withdraw after submitting work.
                    </p>
                  ) : null}
                </form>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
