import { ArrowLeft, Info } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { PeerReviewUploadForm } from "@/components/peer-review/upload-form";
import { ButtonLink, Card, PageHeader } from "@/components/ui";

export const metadata = {
  title: "Submit for peer review",
  description: "Upload a document and ask classmates for structured feedback.",
};

export default async function NewReviewDocumentPage() {
  const user = await requireRole("STUDENT");

  const enrolments = await db.enrollment.findMany({
    where: { studentId: user.id },
    orderBy: { course: { code: "asc" } },
    select: { course: { select: { id: true, code: true, title: true } } },
  });

  return (
    <>
      <PageHeader
        eyebrow="Peer review"
        title="Submit a document for review"
        description="Upload a draft, say what you want feedback on, and Lume AI will pair you with classmates. Reviews are double-blind in both directions."
        action={
          <ButtonLink href="/student/peer-review" variant="secondary">
            <ArrowLeft className="size-4" />
            Back
          </ButtonLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
        <PeerReviewUploadForm courses={enrolments.map((e) => e.course)} />

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Info className="size-4 text-brand" />
              What happens next
            </h2>
            <ol className="mt-3 space-y-3 text-sm text-muted">
              {[
                "Your document is read and its text extracted so reviewers can read it in the browser.",
                "Lume AI asks classmates who have put their own work up first — least busy first.",
                "If nobody is free, your document sits in the open pool and any classmate can pick it up.",
                "Each reviewer rates six criteria and writes what is working and what to change.",
                "You are notified as each review arrives, and you never learn who wrote it.",
              ].map((step, index) => (
                <li key={step} className="flex gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Getting useful feedback</h2>
            <p className="mt-2 text-sm text-muted">
              Reviewers respond to what you ask them. “Is this any good?” gets a
              vague answer; “does the argument in section 3 follow from the
              evidence?” gets a specific one.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
