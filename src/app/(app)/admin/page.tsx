import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardHeader, PageHeader, Stat, Table, Td, Th } from "@/components/ui";
import { riskLevelFor } from "@/lib/risk";
import { relativeTime } from "@/lib/format";

export const metadata = { title: "Admin · AI-AIMS" };

export default async function AdminDashboard() {
  await requireRole("ADMIN");

  const [
    departments,
    courseCount,
    studentCount,
    lecturerCount,
    submissionCount,
    results,
    recentLogs,
  ] = await Promise.all([
    db.department.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { courses: true, users: true } },
      },
    }),
    db.course.count(),
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({ where: { role: "LECTURER" } }),
    db.submission.count({ where: { isLatest: true } }),
    db.similarityResult.findMany({
      select: {
        overallScore: true,
        submission: {
          select: {
            assignment: {
              select: { course: { select: { departmentId: true } } },
            },
          },
        },
      },
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        detail: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
    }),
  ]);

  const averageSimilarity =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.overallScore, 0) / results.length
      : null;

  // Academic Integrity Index: 100 means every submission is fully original.
  const integrityIndex =
    averageSimilarity === null ? null : Math.round(100 - averageSimilarity);

  // Per-department integrity, for the comparison table.
  const byDepartment = new Map<string, number[]>();
  for (const result of results) {
    const departmentId = result.submission.assignment.course.departmentId;
    const list = byDepartment.get(departmentId) ?? [];
    list.push(result.overallScore);
    byDepartment.set(departmentId, list);
  }

  return (
    <>
      <div data-tour="welcome">
        <PageHeader
          eyebrow="Institution"
          title="Administration"
          description="Institution-wide integrity, structure and activity."
        />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Academic integrity index"
          value={integrityIndex === null ? "—" : `${integrityIndex}/100`}
          hint={
            averageSimilarity === null
              ? "No reports yet"
              : `${averageSimilarity.toFixed(1)}% average similarity`
          }
        />
        <Stat
          label="Students"
          value={studentCount}
          hint={`${lecturerCount} lecturer${lecturerCount === 1 ? "" : "s"}`}
        />
        <Stat
          label="Courses"
          value={courseCount}
          hint={`${departments.length} department${departments.length === 1 ? "" : "s"}`}
        />
        <Stat label="Submissions" value={submissionCount} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Departments"
            description="Integrity index compared across departments."
            action={
              <Link
                href="/admin/departments"
                className="text-sm font-medium text-brand hover:underline"
              >
                Manage
              </Link>
            }
          />
          {departments.length === 0 ? (
            <p className="text-sm text-muted">No departments created yet.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Department</Th>
                  <Th>Courses</Th>
                  <Th>Members</Th>
                  <Th>Integrity</Th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => {
                  const scores = byDepartment.get(department.id) ?? [];
                  const average =
                    scores.length > 0
                      ? scores.reduce((a, b) => a + b, 0) / scores.length
                      : null;
                  return (
                    <tr key={department.id}>
                      <Td>
                        <span className="font-medium">{department.code}</span>
                        <p className="text-xs text-muted">{department.name}</p>
                      </Td>
                      <Td className="tabular-nums">{department._count.courses}</Td>
                      <Td className="tabular-nums">{department._count.users}</Td>
                      <Td>
                        {average === null ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <span
                            className="font-semibold tabular-nums"
                            style={{
                              color: `var(--risk-${riskLevelFor(average).toLowerCase()})`,
                            }}
                          >
                            {Math.round(100 - average)}/100
                          </span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent activity"
            action={
              <Link
                href="/admin/audit"
                className="text-sm font-medium text-brand hover:underline"
              >
                Full log
              </Link>
            }
          />
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentLogs.map((log) => (
                <li key={log.id} className="py-2 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 text-sm">
                      <span className="font-medium">
                        {log.user?.fullName ?? "System"}
                      </span>{" "}
                      <span className="text-muted">
                        {log.action.toLowerCase().replace(/_/g, " ")}
                      </span>
                      {log.detail ? (
                        <span className="text-muted"> · {log.detail}</span>
                      ) : null}
                    </p>
                    <span className="shrink-0 text-xs text-muted">
                      {relativeTime(log.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
