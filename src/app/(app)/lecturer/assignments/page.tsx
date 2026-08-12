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
import { formatDateTime, relativeTime } from "@/lib/format";
import { AssignmentForm } from "./assignment-form";

export const metadata = { title: "Assignments · AI-AIMS" };

export default async function LecturerAssignmentsPage() {
  const user = await requireRole("LECTURER");

  const [courses, rubrics, assignments] = await Promise.all([
    db.course.findMany({
      where: { lecturerId: user.id },
      orderBy: { code: "asc" },
      select: { id: true, code: true, title: true },
    }),
    db.rubric.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, _count: { select: { criteria: true } } },
    }),
    db.assignment.findMany({
      where: { course: { lecturerId: user.id } },
      orderBy: { dueAt: "desc" },
      select: {
        id: true,
        title: true,
        dueAt: true,
        locked: true,
        peerReviewEnabled: true,
        similarityThreshold: true,
        course: { select: { code: true } },
        _count: { select: { submissions: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title="Assignments"
        description="Publish work, set deadlines and configure integrity thresholds."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div>
          {assignments.length === 0 ? (
            <EmptyState
              title="No assignments yet"
              description="Create one using the form to publish it to your enrolled students."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Assignment</Th>
                  <Th>Due</Th>
                  <Th>Submissions</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <Td>
                      <Link
                        href={`/lecturer/assignments/${assignment.id}`}
                        className="font-medium hover:text-brand"
                      >
                        {assignment.title}
                      </Link>
                      <p className="text-xs text-muted">
                        {assignment.course.code} · flags at{" "}
                        {assignment.similarityThreshold}%
                      </p>
                    </Td>
                    <Td>
                      <span className="text-sm">
                        {formatDateTime(assignment.dueAt)}
                      </span>
                      <p className="text-xs text-muted">
                        {relativeTime(assignment.dueAt)}
                      </p>
                    </Td>
                    <Td className="tabular-nums">{assignment._count.submissions}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {assignment.locked ? (
                          <Badge tone="danger">Locked</Badge>
                        ) : (
                          <Badge tone="success">Open</Badge>
                        )}
                        {assignment.peerReviewEnabled ? (
                          <Badge tone="brand">Peer review</Badge>
                        ) : null}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        <aside>
          <Card>
            <CardHeader title="Create assignment" />
            {courses.length === 0 ? (
              <p className="text-sm text-muted">
                You need at least one course before you can publish an assignment.
              </p>
            ) : (
              <AssignmentForm courses={courses} rubrics={rubrics} />
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
