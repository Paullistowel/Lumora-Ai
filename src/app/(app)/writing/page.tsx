import { requireRole } from "@/lib/auth";
import { WritingWorkspace } from "@/components/writing-workspace";

export const metadata = {
  title: "Writing Workspace",
  description: "Write, refine and inspect an academic draft in one focused workspace.",
};

export default async function WritingPage() {
  await requireRole("STUDENT", "LECTURER", "ADMIN");
  return <WritingWorkspace />;
}
