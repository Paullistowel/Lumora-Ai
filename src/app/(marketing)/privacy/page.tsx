import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = {
  title: "Privacy policy",
  description:
    "What data Lume AI collects, why, how long it is kept, and the rights you have over it.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      updated="19 July 2026"
      intro="Student coursework is sensitive data. This page sets out exactly what we hold, why we hold it, and what you can ask us to do with it — in plain language, not legalese."
      sections={[
        {
          id: "summary",
          heading: "The short version",
          body: (
            <ul>
              <li>
                The free tools at <Link href="/tools">/tools</Link> run entirely
                in your browser. Your text is <strong>never uploaded</strong> —
                there is no endpoint to send it to.
              </li>
              <li>
                If your institution runs Lume AI on its own servers, we hold
                <strong> no student data at all</strong>. Your university is the
                data controller.
              </li>
              <li>We never sell or share personal data, and never use student work to train models.</li>
              <li>Optional cookies stay off until you turn them on.</li>
            </ul>
          ),
        },
        {
          id: "controller",
          heading: "Who controls your data",
          body: (
            <>
              <p>
                Where your university deploys Lume AI on its own infrastructure,
                <strong> the university is the data controller</strong> and we are
                a processor with no access to submissions. Direct subject access
                requests to your institution&apos;s data protection officer.
              </p>
              <p>
                Where you use this website directly — the free tools, the
                newsletter, the contact form — we are the controller for that
                limited data only.
              </p>
            </>
          ),
        },
        {
          id: "collected",
          heading: "What we collect",
          body: (
            <>
              <p><strong>Account data.</strong> Name, institutional email, role, department, matriculation number and level. Needed to attribute submissions and route peer reviews.</p>
              <p><strong>Submissions.</strong> The file you upload, its extracted text, and the paragraph embeddings computed from it. Used to produce your originality report and writing feedback.</p>
              <p><strong>Peer review content.</strong> Your feedback on others&apos; work and its quality assessment. Authors see the feedback anonymously; lecturers see who wrote it.</p>
              <p><strong>Security logs.</strong> Sign-in events, submission events, administrative actions, IP address and browser string. Required to investigate misuse and to satisfy academic audit.</p>
              <p><strong>Marketing data.</strong> Only if you volunteer it: newsletter address and role, or a contact-form message.</p>
              <p><strong>Not collected.</strong> No payment details on the free tier, no third-party advertising identifiers, and nothing at all from the browser tools.</p>
            </>
          ),
        },
        {
          id: "why",
          heading: "Why we process it",
          body: (
            <ul>
              <li><strong>Contract</strong> — running assessment on behalf of your institution.</li>
              <li><strong>Legitimate interests</strong> — securing accounts, preventing abuse, and keeping an audit trail that makes academic-misconduct findings defensible.</li>
              <li><strong>Consent</strong> — newsletter subscription and optional analytics cookies, each withdrawable at any time.</li>
            </ul>
          ),
        },
        {
          id: "ai",
          heading: "Automated processing and AI",
          body: (
            <>
              <p>
                Similarity scores, writing feedback, AI-style scores and peer
                review quality scores are produced automatically. None of them
                is a decision on its own.
              </p>
              <p>
                <strong>No automated decision produces a disciplinary outcome.</strong>{" "}
                A flagged submission is a prompt for a human to look at the
                evidence. You have the right to an explanation of any score
                affecting you and to contest it — every report shows the
                paragraphs and confidence behind its number.
              </p>
              <p>
                We do not use student submissions as training data for any model.
                The embedding model is pre-trained, runs locally, and is never
                fine-tuned on your work.
              </p>
            </>
          ),
        },
        {
          id: "retention",
          heading: "How long we keep it",
          body: (
            <ul>
              <li><strong>Submissions and reports</strong> — for the academic retention period your institution sets, typically the duration of the programme plus one year.</li>
              <li><strong>Audit logs</strong> — 24 months, then deleted.</li>
              <li><strong>Session records</strong> — deleted at expiry, on sign-out, or immediately on password change.</li>
              <li><strong>Newsletter</strong> — until you unsubscribe.</li>
              <li><strong>Contact messages</strong> — 12 months after resolution.</li>
            </ul>
          ),
        },
        {
          id: "sharing",
          heading: "Who sees what",
          body: (
            <>
              <p><strong>Other students</strong> see your submission text only if they are assigned as an anonymous peer reviewer, and never see your name. If your paragraph matches theirs, they see the match as an unnamed &ldquo;Source&rdquo;.</p>
              <p><strong>Your lecturer</strong> sees your submissions, scores, matched sources by name, and your marks.</p>
              <p><strong>Administrators</strong> see aggregate statistics and the audit log.</p>
              <p><strong>We</strong> see nothing at all on an on-premise deployment.</p>
              <p>We do not sell data or share it with advertisers, ever.</p>
            </>
          ),
        },
        {
          id: "rights",
          heading: "Your rights",
          body: (
            <>
              <p>Under UK/EU GDPR and comparable regimes you may request access, correction, erasure, restriction, portability, or object to processing, and withdraw consent at any time.</p>
              <p>
                Some limits apply: we cannot erase an audit record tied to an
                open misconduct investigation, and academic records have
                statutory retention periods. We will always say which exemption
                applies rather than simply refusing.
              </p>
              <p>Requests go to your institution&apos;s data protection officer. For data held by this website, use the <Link href="/contact">contact form</Link>. Under the Ghana Data Protection Act (Act 843) and equivalent regimes, a response is due within 30 days.</p>
            </>
          ),
        },
        {
          id: "security",
          heading: "How it is protected",
          body: (
            <ul>
              <li>Passwords hashed with bcrypt; plaintext is never stored or logged.</li>
              <li>Sessions are server-side and revocable — an administrator can end them instantly.</li>
              <li>Changing your password signs out every other device.</li>
              <li>Role checks are enforced server-side on every request, not hidden in the UI.</li>
              <li>Encryption in transit; encryption at rest where your institution&apos;s infrastructure provides it.</li>
            </ul>
          ),
        },
        {
          id: "cookies",
          heading: "Cookies",
          body: (
            <p>
              We set a session cookie and a consent cookie, both strictly
              necessary. Analytics and marketing cookies are optional and off
              until you enable them. Full detail is on the{" "}
              <Link href="/cookies">cookie policy</Link> page.
            </p>
          ),
        },
      ]}
    />
  );
}
