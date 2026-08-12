import { GrammarTool } from "./grammar-tool";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "Free grammar checker",
  description:
    "Check spelling, grammar, punctuation and academic tone in your browser. Nothing is uploaded.",
};

export default function GrammarPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Free tool"
        title="Grammar & academic style checker"
        description="Issues are underlined as you type, with a one-click fix and an explanation for each. Everything runs locally — your text never leaves this browser tab."
      />
      <GrammarTool />
    </div>
  );
}
