import { HumanizerTool } from "./humanizer-tool";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "AI humanizer & AI-style detector",
  description:
    "Score how machine-like your writing reads, then rewrite the vocabulary and rhythm that gives it away.",
};

export default function HumanizerPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Free tool"
        title="AI-style detector & humanizer"
        description="Uniform sentence rhythm and stock phrasing are what make prose read as generated. This scores both, then rewrites them into something that sounds like a person thinking."
      />
      <HumanizerTool />
    </div>
  );
}
