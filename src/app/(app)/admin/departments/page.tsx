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
import { DepartmentForm } from "./department-form";

export const metadata = { title: "Departments" };

export default async function DepartmentsPage() {
  await requireRole("ADMIN");

  const departments = await db.department.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      _count: { select: { courses: true, users: true } },
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Structure"
        title="Departments"
        description="The top level of the academic structure. Courses and users belong to a department."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div>
          {departments.length === 0 ? (
            <EmptyState
              title="No departments yet"
              description="Create one before adding courses or registering students."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Name</Th>
                  <Th>Courses</Th>
                  <Th>Members</Th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.id}>
                    <Td className="font-medium">{department.code}</Td>
                    <Td>{department.name}</Td>
                    <Td className="tabular-nums">{department._count.courses}</Td>
                    <Td className="tabular-nums">{department._count.users}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        <aside>
          <Card>
            <CardHeader title="New department" />
            <DepartmentForm />
          </Card>
        </aside>
      </div>
    </>
  );
}
