import Link from "next/link";
import { KeyRound, Lock, ScrollText, Server, ShieldCheck, UserCheck } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ButtonLink, Card, PageHeader, SectionHeading } from "@/components/ui";

export const metadata = {
  title: "Security",
  description:
    "How Lume AI protects student work: local models, revocable sessions, server-side authorisation and a full audit trail.",
};

const CONTROLS = [
  {
    icon: KeyRound,
    title: "Authentication",
    points: [
      "Passwords hashed with bcrypt at cost 10; plaintext never stored or logged",
      "Six-digit OTP email verification on registration",
      "Changing a password invalidates every other session immediately",
      "Login failures are logged without revealing whether the address exists",
    ],
  },
  {
    icon: UserCheck,
    title: "Authorisation",
    points: [
      "Every role check runs server-side on each request, never in the UI alone",
      "Students cannot open another student's report even with a direct link",
      "Lecturers are checked against course ownership before grading or locking",
      "Suspending an account deletes its sessions at once, not at token expiry",
    ],
  },
  {
    icon: Lock,
    title: "Sessions",
    points: [
      "Signed JWT paired with a server-side session row, so tokens are revocable",
      "HTTP-only, SameSite=Lax, Secure in production",
      "Seven-day expiry with the row checked on every request",
      "Active sessions listed in Settings with device and start time",
    ],
  },
  {
    icon: Server,
    title: "Data handling",
    points: [
      "Embedding model runs locally — no submission is sent to a third-party API",
      "Storage keys are opaque UUIDs; path traversal is rejected at the boundary",
      "Free browser tools have no upload endpoint at all",
      "On-premise deployment means student work never leaves your network",
    ],
  },
  {
    icon: ScrollText,
    title: "Audit",
    points: [
      "Every sign-in, submission, recheck, grade and admin action is recorded",
      "Logs capture actor, action, entity, detail and IP address",
      "Logging failures never roll back the action being logged",
      "Administrators can filter and page the full trail",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Application hardening",
    points: [
      "All input validated with schemas at the server boundary",
      "Parameterised queries throughout via Prisma — no string-built SQL",
      "File type and size checked before parsing, not after",
      "Contact form protected by a honeypot rather than a third-party captcha",
    ],
  },
] as const;

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Security"
        title="Built for data you cannot afford to leak"
        description="Unpublished coursework, marks and misconduct records are among the most sensitive data a university holds. These are the specific controls protecting them."
      />

      <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {CONTROLS.map((control) => (
          <StaggerItem key={control.title}>
            <Card interactive className="h-full">
              <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <control.icon className="size-4.5" />
              </span>
              <h2 className="font-semibold">{control.title}</h2>
              <ul className="mt-3 space-y-2">
                {control.points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-muted">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                    {point}
                  </li>
                ))}
              </ul>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <section className="mt-24">
          <SectionHeading
            eyebrow="Disclosure"
            title="Found something? Tell us."
            description="We would much rather hear about a vulnerability from you than from an incident report."
          />

          <Card className="mx-auto mt-10 max-w-3xl p-8">
            <h3 className="font-semibold">Reporting a vulnerability</h3>
            <p className="mt-2 text-muted">
              Lume AI is a student research project and does not operate a
              monitored security mailbox. Report anything you find through the{" "}
              <Link href="/contact" className="font-medium text-brand hover:underline">
                contact form
              </Link>{" "}
              with steps to reproduce, choosing the security topic. If you are
              testing a deployment run by a university, report it to that
              institution&apos;s IT security team as well — they operate the system
              and can act on it immediately.
            </p>

            <h3 className="mt-6 font-semibold">Our commitments to you</h3>
            <ul className="mt-2 space-y-2">
              {[
                "We will not pursue legal action for good-faith research",
                "We will keep you updated as we work on the fix",
                "We will credit you publicly if you want to be credited",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-muted">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>

            <h3 className="mt-6 font-semibold">Please do not</h3>
            <ul className="mt-2 space-y-2">
              {[
                "Access, modify or delete data belonging to real students",
                "Run automated scanners against a live institutional deployment",
                "Publish before we have had a reasonable chance to fix it",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-muted">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-risk-critical" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-20">
          <Card className="mx-auto max-w-3xl p-8">
            <h2 className="text-lg font-semibold">Honest scope</h2>
            <p className="mt-2 text-muted">
              Lume AI is a platform in academic development. The controls above
              are implemented and verifiable in the source. We do not hold
              SOC 2 or ISO 27001 certification, and we are not going to imply
              otherwise — if your procurement process requires one, tell us early
              so nobody wastes time.
            </p>
            <ButtonLink href="/contact" variant="secondary" className="mt-5">
              Ask a security question
            </ButtonLink>
          </Card>
        </section>
      </Reveal>
    </div>
  );
}
