import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { assignLecturer } from "../actions";
import { CourseForm } from "./course-form";

export const metadata = { title: "Courses" };

export default async function AdminCoursesPage() {
  await requireRole("ADMIN");

  const [courses, departments, lecturers] = await Promise.all([
    db.course.findMany({
      orderBy: [{ department: { code: "asc" } }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        title: true,
        level: true,
        semester: true,
        lecturerId: true,
        department: { select: { code: true } },
        _count: { select: { enrollments: true, assignments: true } },
      },
    }),
    db.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    db.user.findMany({
      where: { role: "LECTURER", suspended: false },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Structure"
        title="Courses"
        description="Create courses and assign the lecturer who owns each one."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div>
          {courses.length === 0 ? (
            <EmptyState
              title="No courses yet"
              description="Create a department first, then add courses to it."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Course</Th>
                  <Th>Department</Th>
                  <Th>Enrolled</Th>
                  <Th>Lecturer</Th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <Td>
                      <span className="font-medium">{course.code}</span>
                      <p className="text-xs text-muted">
                        {course.title} · L{course.level} · {course.semester}
                      </p>
                    </Td>
                    <Td className="text-muted">{course.department.code}</Td>
                    <Td className="tabular-nums">
                      {course._count.enrollments}
                      <p className="text-xs text-muted">
                        {course._count.assignments} assignment
                        {course._count.assignments === 1 ? "" : "s"}
                      </p>
                    </Td>
                    <Td>
                      <form action={assignLecturer} className="flex gap-1.5">
                        <input type="hidden" name="courseId" value={course.id} />
                        <select
                          name="lecturerId"
                          defaultValue={course.lecturerId ?? ""}
                          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1 text-sm"
                        >
                          <option value="">Unassigned</option>
                          {lecturers.map((lecturer) => (
                            <option key={lecturer.id} value={lecturer.id}>
                              {lecturer.fullName}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-surface-muted"
                        >
                          Set
                        </button>
                      </form>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        <aside>
          <Card>
            <CardHeader title="New course" />
            {departments.length === 0 ? (
              <p className="text-sm text-muted">Create a department first.</p>
            ) : (
              <CourseForm departments={departments} lecturers={lecturers} />
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
