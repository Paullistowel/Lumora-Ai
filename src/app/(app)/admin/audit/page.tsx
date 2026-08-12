import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Button, PageHeader, Table, Td, Th } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Audit log · AI-AIMS" };

const PAGE_SIZE = 50;

const TONE: Record<string, "danger" | "warning" | "success" | "neutral"> = {
  LOGIN_FAILED: "danger",
  USER_SUSPENDED: "danger",
  LOGIN: "success",
  SUBMIT: "success",
  GRADE: "success",
  RECHECK: "warning",
  PASSWORD_CHANGED: "warning",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  await requireRole("ADMIN");
  const { action = "", page = "1" } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);

  const where = action ? { action } : {};

  const [logs, total, actions] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        action: true,
        entity: true,
        detail: true,
        ipAddress: true,
        createdAt: true,
        user: { select: { fullName: true, email: true, role: true } },
      },
    }),
    db.auditLog.count({ where }),
    db.auditLog.groupBy({ by: ["action"], _count: true }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        eyebrow="Security"
        title="Audit log"
        description={`${total} recorded event${total === 1 ? "" : "s"}. Module 19 keeps an immutable trail of every meaningful action.`}
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <select
          name="action"
          defaultValue={action}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">All actions</option>
          {actions
            .sort((a, b) => a.action.localeCompare(b.action))
            .map((entry) => (
              <option key={entry.action} value={entry.action}>
                {entry.action.toLowerCase().replace(/_/g, " ")} ({entry._count})
              </option>
            ))}
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <Table>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Actor</Th>
            <Th>Action</Th>
            <Th>Detail</Th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <Td className="whitespace-nowrap text-muted">
                {formatDateTime(log.createdAt)}
              </Td>
              <Td>
                {log.user ? (
                  <>
                    <span className="font-medium">{log.user.fullName}</span>
                    <p className="text-xs text-muted">{log.user.email}</p>
                  </>
                ) : (
                  <span className="text-muted">System</span>
                )}
              </Td>
              <Td>
                <Badge tone={TONE[log.action] ?? "neutral"}>
                  {log.action.toLowerCase().replace(/_/g, " ")}
                </Badge>
              </Td>
              <Td className="text-muted">
                {log.detail ?? log.entity ?? "—"}
                {log.ipAddress ? (
                  <p className="text-xs">{log.ipAddress}</p>
                ) : null}
              </Td>
            </tr>
          ))}
          {logs.length === 0 ? (
            <tr>
              <Td colSpan={4} className="text-center text-muted">
                No events recorded.
              </Td>
            </tr>
          ) : null}
        </tbody>
      </Table>

      {totalPages > 1 ? (
        <nav className="mt-4 flex items-center justify-between text-sm">
          <a
            href={`?action=${action}&page=${pageNumber - 1}`}
            aria-disabled={pageNumber <= 1}
            className={
              pageNumber <= 1
                ? "pointer-events-none text-muted opacity-50"
                : "font-medium text-brand hover:underline"
            }
          >
            ← Previous
          </a>
          <span className="text-muted">
            Page {pageNumber} of {totalPages}
          </span>
          <a
            href={`?action=${action}&page=${pageNumber + 1}`}
            aria-disabled={pageNumber >= totalPages}
            className={
              pageNumber >= totalPages
                ? "pointer-events-none text-muted opacity-50"
                : "font-medium text-brand hover:underline"
            }
          >
            Next →
          </a>
        </nav>
      ) : null}
    </>
  );
}
