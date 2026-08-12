import { Fragment } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import {
  Badge, ButtonLink, Card, PageHeader, SectionHeading, Table, Td, Th,
} from "@/components/ui";

export const metadata = {
  title: "Pricing · AI-AIMS",
  description:
    "Free for individual students, per-department for teaching staff, and institution-wide licensing with on-premise deployment.",
};

const PLANS = [
  {
    name: "Student",
    price: "Free",
    cadence: "forever",
    summary: "Everything an individual student needs to submit and improve.",
    cta: { label: "Create free account", href: "/register" },
    featured: false,
    features: [
      "All three writing tools, no account needed",
      "Unlimited assignment submissions",
      "Originality report with paragraph heatmap",
      "Writing feedback and improvement tracking",
      "Peer review participation",
      "Integrity knowledge base",
    ],
  },
  {
    name: "Department",
    price: "£3",
    cadence: "per student / term",
    summary: "For teaching staff running assessment across their courses.",
    cta: { label: "Talk to us", href: "/contact" },
    featured: true,
    features: [
      "Everything in Student",
      "Course and assignment management",
      "Cohort similarity dashboard and risk flags",
      "Rubric builder with department templates",
      "Peer review allocation and quality scoring",
      "Marking workflow with feedback",
      "CSV export of reports",
      "Email support, two working days",
    ],
  },
  {
    name: "Institution",
    price: "Custom",
    cadence: "annual licence",
    summary: "Whole-institution deployment on your own infrastructure.",
    cta: { label: "Arrange a call", href: "/contact" },
    featured: false,
    features: [
      "Everything in Department",
      "On-premise or private-cloud deployment",
      "Academic Integrity Index and board reporting",
      "SSO and directory sync",
      "Full audit log and data-retention controls",
      "Custom similarity thresholds and policy rules",
      "Named contact and onboarding support",
      "Data processing agreement",
    ],
  },
] as const;

type Row = { label: string; student: boolean | string; department: boolean | string; institution: boolean | string };

const COMPARISON: { group: string; rows: Row[] }[] = [
  {
    group: "Detection",
    rows: [
      { label: "Free browser tools", student: true, department: true, institution: true },
      { label: "Semantic similarity across cohort", student: true, department: true, institution: true },
      { label: "Paragraph heatmap and evidence", student: true, department: true, institution: true },
      { label: "Configurable thresholds", student: false, department: true, institution: true },
      { label: "Cross-cohort and historical corpus", student: false, department: false, institution: true },
    ],
  },
  {
    group: "Teaching",
    rows: [
      { label: "Writing feedback", student: true, department: true, institution: true },
      { label: "Peer review", student: "Participate", department: "Run and monitor", institution: "Run and monitor" },
      { label: "Rubric builder", student: false, department: true, institution: true },
      { label: "Marking workflow", student: false, department: true, institution: true },
    ],
  },
  {
    group: "Administration",
    rows: [
      { label: "Personal analytics", student: true, department: true, institution: true },
      { label: "Cohort analytics", student: false, department: true, institution: true },
      { label: "Department comparison", student: false, department: false, institution: true },
      { label: "Audit log", student: false, department: "Own courses", institution: "Full" },
      { label: "SSO / directory sync", student: false, department: false, institution: true },
    ],
  },
  {
    group: "Deployment",
    rows: [
      { label: "Hosted", student: true, department: true, institution: true },
      { label: "On-premise", student: false, department: false, institution: true },
      { label: "Data processing agreement", student: false, department: false, institution: true },
    ],
  },
];

const FAQ = [
  {
    q: "Is the student tier really free?",
    a: "Yes. Submissions, originality reports, writing feedback and the three browser tools cost nothing and always will. Institutions pay for the teaching and administration layer — the coursework side stays free for the people writing it.",
  },
  {
    q: "How is 'per student' counted?",
    a: "By students enrolled in at least one course using the platform during that term. A student enrolled in six courses counts once, and a student who never submits is not billed.",
  },
  {
    q: "Do you train models on our students' work?",
    a: "No. Submissions are used only to compute similarity within your own institution. Nothing is used to train any model, and on an on-premise deployment nothing leaves your network at all.",
  },
  {
    q: "What happens to the data if we stop using it?",
    a: "You get a full export in open formats, and we delete our copy on confirmation. On-premise deployments hold the only copy from the start.",
  },
  {
    q: "Can we pilot it on one department first?",
    a: "That's the usual route. Start with one department for a term, measure the change, then decide. There's no minimum commitment on the Department tier.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Pricing"
        title="Free for students. Priced for institutions."
        description="The people writing the coursework never pay. Departments and institutions pay for the assessment, analytics and administration layer built on top."
      />

      <Stagger className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <StaggerItem key={plan.name}>
            <div className={plan.featured ? "glow-ring rounded-2xl" : ""}>
              <Card
                className={`flex h-full flex-col ${
                  plan.featured ? "border-transparent shadow-[var(--shadow-lg)]" : ""
                }`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  {plan.featured ? <Badge tone="brand">Most common</Badge> : null}
                </div>

                <p className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted">{plan.cadence}</span>
                </p>
                <p className="mt-3 text-sm text-muted">{plan.summary}</p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-risk-original" />
                      <span className="text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>

                <ButtonLink
                  href={plan.cta.href}
                  variant={plan.featured ? "gradient" : "secondary"}
                  className="mt-7 w-full py-3"
                >
                  {plan.cta.label}
                </ButtonLink>
              </Card>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <p className="mt-6 text-center text-sm text-muted">
          Prices exclude VAT. Institutional pricing scales with size — ask us for
          a figure against your actual enrolment.
        </p>
      </Reveal>

      {/* Comparison */}
      <Reveal>
        <section className="mt-24">
          <SectionHeading eyebrow="Compare" title="What's in each tier" />

          <div className="mt-10">
            <Table>
              <thead>
                <tr>
                  <Th className="w-[40%]">Feature</Th>
                  <Th className="text-center">Student</Th>
                  <Th className="text-center">Department</Th>
                  <Th className="text-center">Institution</Th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((section) => (
                  <Fragment key={section.group}>
                    <tr>
                      <Td
                        colSpan={4}
                        className="bg-surface-muted/60 text-xs font-semibold tracking-wide text-muted uppercase"
                      >
                        {section.group}
                      </Td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr key={row.label}>
                        <Td className="font-medium">{row.label}</Td>
                        {([row.student, row.department, row.institution] as const).map(
                          (value, i) => (
                            <Td key={i} className="text-center">
                              <Cell value={value} />
                            </Td>
                          ),
                        )}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </Table>
          </div>
        </section>
      </Reveal>

      {/* FAQ */}
      <Reveal>
        <section className="mt-24">
          <SectionHeading eyebrow="Questions" title="Before you ask" />
          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
              >
                <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {item.q}
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-pretty text-muted">{item.a}</p>
              </details>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted">
            Something not covered?{" "}
            <Link href="/contact" className="font-medium text-brand hover:underline">
              Ask us directly
            </Link>
            .
          </p>
        </section>
      </Reveal>
    </div>
  );
}

function Cell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <>
        <Check className="mx-auto size-4 text-risk-original" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus className="mx-auto size-4 text-muted opacity-40" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="text-xs text-muted">{value}</span>;
}
