import Link from "next/link";
import { BookOpen, Building2, Clock, LifeBuoy, Mail, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion";
import { Card, PageHeader } from "@/components/ui";
import { ContactForm } from "./contact-form";

export const metadata = {
  title: "Contact · AI-AIMS",
  description:
    "Talk to us about a departmental pilot, institutional licensing or on-premise deployment.",
};

const CHANNELS = [
  {
    icon: Building2,
    title: "Institutional enquiries",
    body: "Licensing, pilots and procurement paperwork.",
    detail: "institutions@ai-aims.example",
  },
  {
    icon: LifeBuoy,
    title: "Support",
    body: "For staff and students on an existing deployment.",
    detail: "support@ai-aims.example",
  },
  {
    icon: ShieldCheck,
    title: "Security & data protection",
    body: "Vulnerability reports, DPAs and subject access requests.",
    detail: "security@ai-aims.example",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Contact"
        title="Tell us what you're trying to do"
        description="Whether you're piloting one course or licensing an institution, a real person reads this and replies within two working days."
      />

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <Card className="p-6 sm:p-8">
            <ContactForm />
          </Card>
        </Reveal>

        <div className="space-y-4">
          <Reveal delay={0.1}>
            <Card>
              <div className="flex gap-3">
                <Clock className="size-4 shrink-0 text-brand" />
                <div>
                  <h2 className="text-sm font-semibold">Response times</h2>
                  <p className="mt-1.5 text-sm text-muted">
                    Two working days for general enquiries. Security reports are
                    acknowledged within 24 hours.
                  </p>
                </div>
              </div>
            </Card>
          </Reveal>

          {CHANNELS.map((channel, i) => (
            <Reveal key={channel.title} delay={0.15 + i * 0.07}>
              <Card interactive>
                <div className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <channel.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">{channel.title}</h2>
                    <p className="mt-1 text-sm text-muted">{channel.body}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium break-all text-brand">
                      <Mail className="size-3.5 shrink-0" />
                      {channel.detail}
                    </p>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}

          <Reveal delay={0.4}>
            <Card>
              <div className="flex gap-3">
                <BookOpen className="size-4 shrink-0 text-brand" />
                <div>
                  <h2 className="text-sm font-semibold">Looking for an answer now?</h2>
                  <p className="mt-1.5 text-sm text-muted">
                    The{" "}
                    <Link href="/help" className="font-medium text-brand hover:underline">
                      help centre
                    </Link>{" "}
                    covers setup, scoring, peer review and data handling. The{" "}
                    <Link href="/pricing" className="font-medium text-brand hover:underline">
                      pricing FAQ
                    </Link>{" "}
                    covers licensing.
                  </p>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
