import { PlagiarismTool } from "./plagiarism-tool";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "Free plagiarism checker",
  description:
    "Compare your draft against your own sources and see which paragraphs overlap. Runs entirely in your browser.",
};

export default function PlagiarismPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Free tool"
        title="Plagiarism & overlap checker"
        description="Paste your draft and the sources you worked from. You'll get a per-paragraph overlap score and the closest matching passage, so you know exactly where a citation is missing."
      />
      <PlagiarismTool />
    </div>
  );
}
