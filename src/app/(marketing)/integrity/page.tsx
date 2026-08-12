import { IntegrityGuide } from "@/components/integrity-guide";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "Academic integrity guide · AI-AIMS",
  description:
    "What plagiarism actually is, how similarity scores are calculated, and how to cite in APA, IEEE, Harvard and MLA.",
};

export default function PublicIntegrityPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Knowledge base"
        title="Academic integrity guide"
        description="Written for students, not for disciplinary panels. What counts as plagiarism, how your similarity score is produced, and the habits that keep you out of trouble."
      />
      <IntegrityGuide />
    </div>
  );
}
