import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { toggleSuspension } from "../actions";
import { StaffForm } from "./staff-form";

export const metadata = { title: "Users · AI-AIMS" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const admin = await requireRole("ADMIN");
  const { q = "", role = "" } = await searchParams;

  const [users, departments] = await Promise.all([
    db.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(q
          ? {
              OR: [
                { fullName: { contains: q } },
                { email: { contains: q } },
                { matricNumber: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
      take: 200,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        matricNumber: true,
        suspended: true,
        emailVerified: true,
        createdAt: true,
        department: { select: { code: true } },
      },
    }),
    db.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Users"
        description="Every account on the platform. Module 16 search covers name, email and matric number."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <form className="flex flex-wrap gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name, email or matric number"
              className="min-w-48 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
            <select
              name="role"
              defaultValue={role}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">All roles</option>
              <option value="STUDENT">Students</option>
              <option value="LECTURER">Lecturers</option>
              <option value="ADMIN">Admins</option>
            </select>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Department</Th>
                <Th>Status</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <Td>
                    <span className="font-medium">{user.fullName}</span>
                    <p className="text-xs text-muted">
                      {user.email}
                      {user.matricNumber ? ` · ${user.matricNumber}` : ""}
                    </p>
                  </Td>
                  <Td className="text-muted capitalize">
                    {user.role.toLowerCase()}
                  </Td>
                  <Td className="text-muted">{user.department?.code ?? "—"}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {user.suspended ? (
                        <Badge tone="danger">Suspended</Badge>
                      ) : (
                        <Badge tone="success">Active</Badge>
                      )}
                      {!user.emailVerified ? (
                        <Badge tone="warning">Unverified</Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      Joined {formatDate(user.createdAt)}
                    </p>
                  </Td>
                  <Td className="text-right">
                    {user.id === admin.id ? (
                      <span className="text-xs text-muted">You</span>
                    ) : (
                      <form action={toggleSuspension}>
                        <input type="hidden" name="userId" value={user.id} />
                        <Button
                          type="submit"
                          variant={user.suspended ? "secondary" : "danger"}
                          className="px-3 py-1.5 text-xs"
                        >
                          {user.suspended ? "Reinstate" : "Suspend"}
                        </Button>
                      </form>
                    )}
                  </Td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <Td colSpan={5} className="text-center text-muted">
                    No users match that search.
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </div>

        <aside>
          <Card>
            <CardHeader
              title="Create staff account"
              description="Lecturers and administrators are provisioned here."
            />
            <StaffForm departments={departments} />
          </Card>
        </aside>
      </div>
    </>
  );
}
