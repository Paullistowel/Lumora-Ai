import type { ReactNode } from "react";
import Link from "next/link";
import { Reveal } from "../motion";
import { Card, PageHeader } from "../ui";

export type LegalSection = {
  id: string;
  heading: string;
  body: ReactNode;
};

/**
 * Shared shell for the policy pages: sticky contents on the left, prose on the
 * right. Keeping them on one component means the four policies cannot drift
 * apart in tone or structure.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader eyebrow={eyebrow} title={title} description={intro} />

      <p className="mb-10 text-sm text-muted">
        Last updated <time>{updated}</time>
      </p>

      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
            On this page
          </p>
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <Link
                  href={`#${section.id}`}
                  className="focus-ring block rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  {section.heading}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-5">
          {sections.map((section, i) => (
            <Reveal key={section.id} delay={Math.min(i * 0.04, 0.3)}>
              <Card id={section.id} className="scroll-mt-28 p-6 sm:p-8">
                <h2 className="mb-4 text-xl font-semibold tracking-tight">
                  {section.heading}
                </h2>
                <div className="space-y-4 text-pretty text-muted [&_a]:font-medium [&_a]:text-brand hover:[&_a]:underline [&_li]:leading-relaxed [&_p]:leading-relaxed [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                  {section.body}
                </div>
              </Card>
            </Reveal>
          ))}

          <Card className="p-6 sm:p-8">
            <h2 className="mb-2 text-lg font-semibold">Questions about this policy?</h2>
            <p className="text-muted">
              Use the{" "}
              <Link href="/contact" className="font-medium text-brand hover:underline">
                contact form
              </Link>
              , or contact the data protection officer at the institution running
              this deployment
              . We reply to data requests within 30 days, and usually far sooner.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
