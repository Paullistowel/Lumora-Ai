import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";

export const metadata = { title: "Courses · AI-AIMS" };

export default async function LecturerCoursesPage() {
  const user = await requireRole("LECTURER");

  const courses = await db.course.findMany({
    where: { lecturerId: user.id },
    orderBy: [{ level: "asc" }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      title: true,
      level: true,
      semester: true,
      department: { select: { name: true } },
      _count: { select: { assignments: true, enrollments: true } },
      enrollments: {
        select: {
          student: {
            select: { id: true, fullName: true, matricNumber: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (courses.length === 0) {
    return (
      <>
        <PageHeader title="Courses" />
        <EmptyState
          title="No courses assigned"
          description="An administrator assigns lecturers to courses."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Teaching"
        title="Courses"
        description="The courses you teach and the students enrolled in them."
      />

      <div className="space-y-5">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader
              title={`${course.code} — ${course.title}`}
              description={`${course.department.name} · Level ${course.level} · ${course.semester}`}
              action={
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">
                    {course._count.assignments} assignment
                    {course._count.assignments === 1 ? "" : "s"}
                  </Badge>
                  <Badge tone="brand">{course._count.enrollments} enrolled</Badge>
                </div>
              }
            />

            {course.enrollments.length === 0 ? (
              <p className="text-sm text-muted">No students enrolled yet.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th>Matric number</Th>
                    <Th>Email</Th>
                  </tr>
                </thead>
                <tbody>
                  {course.enrollments.map((enrollment) => (
                    <tr key={enrollment.student.id}>
                      <Td className="font-medium">{enrollment.student.fullName}</Td>
                      <Td className="text-muted">
                        {enrollment.student.matricNumber ?? "—"}
                      </Td>
                      <Td className="text-muted">{enrollment.student.email}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            <div className="mt-4 border-t border-border pt-4">
              <Link
                href="/lecturer/assignments"
                className="text-sm font-medium text-brand hover:underline"
              >
                Manage assignments →
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
