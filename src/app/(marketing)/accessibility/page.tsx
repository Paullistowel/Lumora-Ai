import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = {
  title: "Accessibility · AI-AIMS",
  description:
    "Our accessibility commitments, what is implemented, and what still needs work.",
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Commitment"
      title="Accessibility statement"
      updated="19 July 2026"
      intro="Assessment software cannot be optional to use. If a student cannot submit their work because of how we built the interface, that is a failure with academic consequences."
      sections={[
        {
          id: "standard",
          heading: "The standard we hold ourselves to",
          body: (
            <p>
              We target <strong>WCAG 2.2 Level AA</strong>. Some parts of the
              platform meet it today and some do not — the honest list is below,
              rather than a blanket claim of compliance.
            </p>
          ),
        },
        {
          id: "implemented",
          heading: "What is implemented",
          body: (
            <ul>
              <li>Every interactive element is reachable and operable by keyboard, with a visible focus ring.</li>
              <li>Colour is never the only carrier of meaning — risk bands pair colour with a text label and a percentage.</li>
              <li>Body text meets AA contrast in both light and dark themes.</li>
              <li><code>prefers-reduced-motion</code> disables every animation, parallax and 3D tilt on the site.</li>
              <li>Decorative illustrations carry empty alt text; meaningful ones are described.</li>
              <li>Form fields have real labels, and errors are announced rather than shown only in colour.</li>
              <li>The grammar checker uses a native textarea, so the browser caret, selection, undo history and IME all keep working.</li>
              <li>Tables scroll inside their own container, so the page never scrolls sideways.</li>
            </ul>
          ),
        },
        {
          id: "gaps",
          heading: "Known gaps",
          body: (
            <>
              <p>These are real, and we are not going to pretend otherwise:</p>
              <ul>
                <li>The similarity heatmap conveys match strength through background tint as well as a percentage; screen reader users get the percentage but not the visual grouping.</li>
                <li>Grammar issue cards are not yet wired to a live region, so newly appearing suggestions are not announced automatically.</li>
                <li>The paragraph-level report has not been tested end to end with JAWS.</li>
                <li>Some dense data tables would benefit from row headers we have not yet added.</li>
              </ul>
            </>
          ),
        },
        {
          id: "feedback",
          heading: "Tell us where it fails",
          body: (
            <p>
              If something blocks you, email{" "}
              <a href="mailto:accessibility@ai-aims.example">
                accessibility@ai-aims.example
              </a>{" "}
              or use the <Link href="/contact">contact form</Link>. Barriers that
              stop a student submitting work are treated as urgent, not as
              feature requests. Tell us what you were trying to do, what
              happened, and what assistive technology you use.
            </p>
          ),
        },
        {
          id: "alternatives",
          heading: "If you are blocked right now",
          body: (
            <p>
              Contact your lecturer or department administrator directly. They
              can accept a submission by another route and enter it on your
              behalf — no student should miss a deadline because of our
              interface.
            </p>
          ),
        },
      ]}
    />
  );
}
