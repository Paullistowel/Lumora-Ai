import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { RubricForm } from "./rubric-form";

export const metadata = { title: "Rubrics" };

export default async function RubricsPage() {
  await requireRole("LECTURER");

  const rubrics = await db.rubric.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      isTemplate: true,
      criteria: {
        orderBy: { order: "asc" },
        select: { id: true, label: true, description: true, maxScore: true, weight: true },
      },
      _count: { select: { assignments: true } },
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Marking"
        title="Rubrics"
        description="Reusable marking criteria for assignments and peer review."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          {rubrics.length === 0 ? (
            <EmptyState
              title="No rubrics yet"
              description="Create one to structure peer review and your own marking."
            />
          ) : (
            rubrics.map((rubric) => {
              const total = rubric.criteria.reduce((sum, c) => sum + c.maxScore, 0);
              return (
                <Card key={rubric.id}>
                  <CardHeader
                    title={rubric.name}
                    description={rubric.description ?? undefined}
                    action={
                      <div className="flex gap-1.5">
                        {rubric.isTemplate ? (
                          <Badge tone="brand">Template</Badge>
                        ) : null}
                        <Badge tone="neutral">{total} pts</Badge>
                      </div>
                    }
                  />
                  <ul className="space-y-2">
                    {rubric.criteria.map((criterion) => (
                      <li
                        key={criterion.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{criterion.label}</p>
                          {criterion.description ? (
                            <p className="mt-0.5 text-sm text-muted">
                              {criterion.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums">
                            {criterion.maxScore}
                          </p>
                          <p className="text-xs text-muted">×{criterion.weight}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted">
                    Used by {rubric._count.assignments} assignment
                    {rubric._count.assignments === 1 ? "" : "s"}
                  </p>
                </Card>
              );
            })
          )}
        </div>

        <aside>
          <Card>
            <CardHeader title="New rubric" />
            <RubricForm />
          </Card>
        </aside>
      </div>
    </>
  );
}
