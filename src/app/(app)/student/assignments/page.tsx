import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Badge,
  ButtonLink,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { formatDateTime, relativeTime } from "@/lib/format";

export const metadata = { title: "Assignments" };

export default async function AssignmentsPage() {
  const user = await requireRole("STUDENT");

  const enrollments = await db.enrollment.findMany({
    where: { studentId: user.id },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  const assignments =
    courseIds.length > 0
      ? await db.assignment.findMany({
          where: { courseId: { in: courseIds } },
          orderBy: { dueAt: "asc" },
          select: {
            id: true,
            title: true,
            dueAt: true,
            locked: true,
            allowLate: true,
            maxMarks: true,
            course: { select: { code: true, title: true } },
            submissions: {
              where: { studentId: user.id, isLatest: true },
              select: { id: true, isLate: true, version: true },
            },
          },
        })
      : [];

  return (
    <>
      <PageHeader
        eyebrow="Coursework"
        title="Assignments"
        description="Everything set for the courses you are enrolled in."
      />

      {assignments.length === 0 ? (
        <EmptyState
          title={courseIds.length === 0 ? "You are not enrolled in any course" : "No assignments yet"}
          description={
            courseIds.length === 0
              ? "Enrol in a course to see its assignments and deadlines."
              : "Your lecturers have not published anything yet."
          }
          action={
            courseIds.length === 0 ? (
              <ButtonLink href="/student/courses">Browse courses</ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Assignment</Th>
              <Th>Course</Th>
              <Th>Due</Th>
              <Th>Status</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => {
              const submission = assignment.submissions[0];
              const overdue = new Date() > assignment.dueAt;
              return (
                <tr key={assignment.id}>
                  <Td>
                    <Link
                      href={`/student/assignments/${assignment.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {assignment.title}
                    </Link>
                    <p className="text-xs text-muted">{assignment.maxMarks} marks</p>
                  </Td>
                  <Td className="text-muted">{assignment.course.code}</Td>
                  <Td>
                    <span className="text-sm">{formatDateTime(assignment.dueAt)}</span>
                    <p className="text-xs text-muted">{relativeTime(assignment.dueAt)}</p>
                  </Td>
                  <Td>
                    {submission ? (
                      <Badge tone={submission.isLate ? "warning" : "success"}>
                        Submitted v{submission.version}
                        {submission.isLate ? " · late" : ""}
                      </Badge>
                    ) : assignment.locked ? (
                      <Badge tone="neutral">Locked</Badge>
                    ) : overdue ? (
                      <Badge tone="danger">
                        {assignment.allowLate ? "Overdue" : "Closed"}
                      </Badge>
                    ) : (
                      <Badge tone="warning">Not submitted</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={
                        submission
                          ? `/student/submissions/${submission.id}`
                          : `/student/assignments/${assignment.id}`
                      }
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      {submission ? "View report" : "Open"}
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
