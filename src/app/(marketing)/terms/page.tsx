import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = {
  title: "Terms of service",
  description: "The terms under which you may use Lume AI and its free tools.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of service"
      updated="19 July 2026"
      intro="The rules for using Lume AI. Where these terms and your institution's own academic regulations disagree, your institution's regulations win."
      sections={[
        {
          id: "acceptance",
          heading: "1. Using this service",
          body: (
            <>
              <p>
                By creating an account or using the free tools you accept these
                terms. If you are using Lume AI through your university, your
                institution&apos;s agreement with us also applies, and its academic
                regulations take precedence over anything here.
              </p>
              <p>You must be 16 or older, or have your institution act on your behalf.</p>
            </>
          ),
        },
        {
          id: "accounts",
          heading: "2. Your account",
          body: (
            <ul>
              <li>Give accurate registration details — submissions are attributed to your identity and feed academic records.</li>
              <li>Keep your credentials to yourself. Sharing an account with someone who then submits work is a misconduct matter for your institution.</li>
              <li>Tell us or your administrator immediately if you think your account has been accessed by someone else.</li>
              <li>Lecturer and administrator accounts are created by your institution, not self-registered.</li>
            </ul>
          ),
        },
        {
          id: "acceptable-use",
          heading: "3. Acceptable use",
          body: (
            <>
              <p>You must not:</p>
              <ul>
                <li>Submit work that is not yours to submit, or help someone else do so.</li>
                <li>Try to identify an anonymous peer reviewer, or use peer review to harass another student.</li>
                <li>Attempt to access submissions, reports or accounts that are not yours.</li>
                <li>Probe, scrape or attack the service, or bypass rate limits and access controls.</li>
                <li>Upload malware, or files designed to break the document parser.</li>
              </ul>
              <p>
                We may suspend an account for breach. Where the breach is
                academic rather than technical, we refer it to your institution
                rather than adjudicating it ourselves.
              </p>
            </>
          ),
        },
        {
          id: "tools",
          heading: "4. The free tools",
          body: (
            <>
              <p>
                The grammar checker, plagiarism checker and humanizer at{" "}
                <Link href="/tools">/tools</Link> are provided free and as-is,
                with no availability guarantee. They run in your browser and we
                receive nothing.
              </p>
              <p>
                <strong>The humanizer is a style tool, not an evasion tool.</strong>{" "}
                Rewriting generated text does not make it your own work, and does
                not discharge any duty to disclose AI assistance. Using it to
                misrepresent authorship is academic misconduct under your
                institution&apos;s rules, and these terms do not shield you from
                that.
              </p>
            </>
          ),
        },
        {
          id: "content",
          heading: "5. Your work stays yours",
          body: (
            <>
              <p>
                You keep all intellectual property in everything you submit. You
                grant us only the narrow licence needed to run the service:
                storing your file, extracting its text, computing embeddings, and
                showing matched paragraphs to your lecturer and to anonymous
                peer reviewers.
              </p>
              <p>
                This licence does not permit publication, resale, or use as
                training data, and it ends when your submission is deleted.
              </p>
            </>
          ),
        },
        {
          id: "scores",
          heading: "6. What our scores mean",
          body: (
            <>
              <p>
                Similarity, writing, AI-style and review-quality scores are{" "}
                <strong>indicators, not findings</strong>. They are produced by
                automated analysis with known limits:
              </p>
              <ul>
                <li>Correctly quoted and cited material registers as similar by design.</li>
                <li>Students working from the same reading list produce genuinely similar arguments.</li>
                <li>A low score with an empty corpus is not evidence of originality — which is why every report shows its confidence.</li>
                <li>AI-style scoring measures style, never provenance.</li>
              </ul>
              <p>
                No academic penalty should ever follow from a score alone. A
                human must review the evidence, and your institution remains
                responsible for any decision it makes.
              </p>
            </>
          ),
        },
        {
          id: "availability",
          heading: "7. Availability",
          body: (
            <p>
              We aim for high availability but do not guarantee uninterrupted
              service on free tiers. Institutional agreements may include a
              separate service level. Do not leave a submission until the last
              minute on the assumption the service will be up.
            </p>
          ),
        },
        {
          id: "liability",
          heading: "8. Liability",
          body: (
            <>
              <p>
                To the extent the law allows, we are not liable for indirect or
                consequential loss, for academic outcomes reached by your
                institution, or for loss of data you have not backed up
                elsewhere.
              </p>
              <p>
                Nothing here limits liability for death or personal injury caused
                by negligence, for fraud, or for anything else that cannot
                lawfully be limited.
              </p>
            </>
          ),
        },
        {
          id: "termination",
          heading: "9. Ending your use",
          body: (
            <p>
              You may close your account at any time; academic records your
              institution is required to keep will survive it. We may suspend or
              close an account for a serious or repeated breach, with notice
              unless doing so would risk harm.
            </p>
          ),
        },
        {
          id: "changes",
          heading: "10. Changes to these terms",
          body: (
            <p>
              We will give at least 30 days&apos; notice of any material change,
              by email and in-app. Continuing to use the service afterwards means
              you accept the revised terms.
            </p>
          ),
        },
      ]}
    />
  );
}
