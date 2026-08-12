import { IntegrityGuide } from "@/components/integrity-guide";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";

export const metadata = { title: "Academic integrity" };

export default async function IntegrityPage() {
  await requireRole("STUDENT");

  return (
    <>
      <PageHeader
        eyebrow="Knowledge base"
        title="Academic integrity guide"
        description="What counts as plagiarism, how to cite, and how your similarity score is calculated."
      />
      <IntegrityGuide />
    </>
  );
}
