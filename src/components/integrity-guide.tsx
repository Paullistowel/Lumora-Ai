import { Card, CardHeader } from "./ui";
import { Reveal, Stagger, StaggerItem } from "./motion";
import { RISK_BANDS } from "@/lib/risk";

/**
 * Module 18 — the academic integrity knowledge base.
 *
 * Shared between the public marketing site and the signed-in student area, so
 * the guidance a student reads before they enrol is identical to the guidance
 * they get afterwards.
 */

const CITATION_STYLES = [
  {
    name: "APA 7th",
    inText: "(Adeyemi & Okoro, 2021)",
    reference:
      "Adeyemi, T., & Okoro, N. (2021). Machine learning in higher education. Journal of Educational Technology, 14(2), 88–104.",
    used: "Social sciences, education, psychology",
  },
  {
    name: "IEEE",
    inText: "[3]",
    reference:
      "[3] T. Adeyemi and N. Okoro, “Machine learning in higher education,” J. Educ. Technol., vol. 14, no. 2, pp. 88–104, 2021.",
    used: "Engineering, computer science",
  },
  {
    name: "Harvard",
    inText: "(Adeyemi and Okoro, 2021, p. 92)",
    reference:
      "Adeyemi, T. and Okoro, N. (2021) ‘Machine learning in higher education’, Journal of Educational Technology, 14(2), pp. 88–104.",
    used: "Business, humanities",
  },
  {
    name: "MLA 9th",
    inText: "(Adeyemi and Okoro 92)",
    reference:
      "Adeyemi, Tunde, and Ngozi Okoro. “Machine Learning in Higher Education.” Journal of Educational Technology, vol. 14, no. 2, 2021, pp. 88–104.",
    used: "Literature, languages, arts",
  },
];

const FORMS = [
  {
    title: "Direct copying",
    body: "Reproducing another person's words without quotation marks and a citation — regardless of how much you change afterwards.",
  },
  {
    title: "Paraphrase without attribution",
    body: "Rewording someone else's idea in your own words is still their idea. It needs a citation even though no words are shared. Semantic detection catches this; word-matching tools do not.",
  },
  {
    title: "Mosaic plagiarism",
    body: "Stitching phrases from several sources into a paragraph that reads as your own.",
  },
  {
    title: "Self-plagiarism",
    body: "Resubmitting work you already submitted for credit elsewhere, without your lecturer's permission.",
  },
  {
    title: "Collusion",
    body: "Working together on an assessment meant to be individual. Both parties are responsible.",
  },
  {
    title: "Undisclosed AI use",
    body: "Submitting generated text as your own where your department's policy requires disclosure. Rewriting it afterwards does not change the answer.",
  },
];

const HABITS = [
  "Record the full source the moment you take a note — reconstructing citations later is where accidents happen.",
  "Quote directly when the exact wording matters; paraphrase when the idea matters. Cite either way.",
  "Write summaries from memory with the source closed, then reopen it to check accuracy.",
  "Keep a reference manager (Zotero, Mendeley) rather than a list at the end of the document.",
  "If you are unsure whether something needs a citation, cite it.",
  "Check your department's policy on AI assistance before you use it, and disclose it when required.",
];

export function IntegrityGuide() {
  return (
    <div className="space-y-5">
      <Reveal>
        <Card>
          <CardHeader
            title="What plagiarism actually is"
            description="Presenting someone else's work, words or ideas as your own — with or without intent."
          />
          <Stagger className="grid gap-3 sm:grid-cols-2">
            {FORMS.map((form) => (
              <StaggerItem key={form.title}>
                <div className="h-full rounded-xl border border-border p-4 transition-colors hover:border-border-strong">
                  <p className="text-sm font-medium">{form.title}</p>
                  <p className="mt-1.5 text-sm text-muted">{form.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Card>
      </Reveal>

      <Reveal>
        <Card>
          <CardHeader
            title="How your similarity score is calculated"
            description="The system compares meaning, not just matching words."
          />
          <ol className="mb-6 space-y-3">
            {[
              "Your document is converted to plain text and split into paragraphs.",
              "Each paragraph becomes a numerical vector capturing its meaning.",
              "Every paragraph is compared against every other submission for the same assignment.",
              "Paragraphs matching at 75% or above are flagged, weighted by length.",
              "The weighted average becomes your overall similarity score.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>

          <div className="space-y-1.5">
            {RISK_BANDS.map((band) => (
              <div
                key={band.level}
                className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: band.color }}
                  aria-hidden
                />
                <span className="w-28 text-sm font-medium">{band.label}</span>
                <span className="text-sm tabular-nums text-muted">
                  {band.min}–{band.max}%
                </span>
              </div>
            ))}
          </div>

          <p className="mt-5 rounded-xl bg-surface-muted px-4 py-3 text-sm text-muted">
            A high score is not a verdict. Correctly quoted and cited material
            still registers as similar — the report tells your lecturer where to
            look, and they make the judgement.
          </p>
        </Card>
      </Reveal>

      <Reveal>
        <Card>
          <CardHeader
            title="Citation styles"
            description="Use whichever style your department mandates, and use it consistently."
          />
          <div className="space-y-3">
            {CITATION_STYLES.map((style) => (
              <div key={style.name} className="rounded-xl border border-border p-4">
                <div className="mb-2.5 flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium">{style.name}</p>
                  <p className="text-xs text-muted">{style.used}</p>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                    <dt className="w-20 shrink-0 text-muted">In text</dt>
                    <dd className="font-mono text-xs break-words">{style.inText}</dd>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                    <dt className="w-20 shrink-0 text-muted">Reference</dt>
                    <dd className="font-mono text-xs break-words">{style.reference}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <Card>
          <CardHeader title="Habits that keep you safe" />
          <ul className="space-y-2.5">
            {HABITS.map((tip, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span aria-hidden className="text-brand">→</span>
                <span className="text-muted">{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>
    </div>
  );
}
