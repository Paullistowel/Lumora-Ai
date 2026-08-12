import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { CookieTable } from "./cookie-table";

export const metadata = {
  title: "Cookie policy",
  description:
    "Every cookie Lume AI sets, what it does, how long it lasts, and how to change your choices.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie policy"
      updated="19 July 2026"
      intro="We set four cookies in total, two of them strictly necessary. Optional cookies stay off until you switch them on — there is no pre-ticked box anywhere on this site."
      sections={[
        {
          id: "what",
          heading: "What cookies we set",
          body: <CookieTable />,
        },
        {
          id: "necessary",
          heading: "Strictly necessary cookies",
          body: (
            <>
              <p>
                <strong>lume_session</strong> holds your signed session token.
                Without it you cannot stay logged in. It is HTTP-only, so page
                scripts cannot read it, and it is revoked server-side the moment
                you sign out or change your password.
              </p>
              <p>
                <strong>aims_consent</strong> records the choice you made in the
                banner. Ironically we need a cookie to remember that you declined
                cookies — otherwise the banner would reappear on every page.
              </p>
              <p>
                These two do not require consent under the ePrivacy Directive
                because the service cannot function without them.
              </p>
            </>
          ),
        },
        {
          id: "optional",
          heading: "Optional cookies",
          body: (
            <>
              <p>
                <strong>Analytics</strong> tells us which pages and features get
                used, so we know what to improve. Aggregate and anonymised — we
                do not build a profile of you.
              </p>
              <p>
                <strong>Marketing</strong> measures which campaigns bring
                institutions to the site. Off by default and genuinely optional.
              </p>
              <p>
                Neither is loaded at all until you consent. Declining costs you
                no functionality.
              </p>
            </>
          ),
        },
        {
          id: "tools",
          heading: "The free tools set nothing",
          body: (
            <p>
              The <Link href="/tools">grammar checker, plagiarism checker and
              humanizer</Link> run entirely in your browser. They set no cookies,
              make no network requests with your text, and work identically
              whether you accept cookies or not.
            </p>
          ),
        },
        {
          id: "change",
          heading: "Changing your mind",
          body: (
            <>
              <p>
                Clear the <code>aims_consent</code> cookie in your browser
                settings and reload — the banner will reappear and you can choose
                again. Your choice is re-requested every six months regardless.
              </p>
              <p>
                You can also block cookies entirely in your browser. Blocking
                strictly necessary cookies will stop you being able to sign in;
                the free tools will still work.
              </p>
            </>
          ),
        },
        {
          id: "third-party",
          heading: "Third parties",
          body: (
            <p>
              We embed no third-party trackers, social widgets, ad pixels or
              external fonts. Every image and script on this site is served from
              our own domain, which is why there is no long list of vendors here.
            </p>
          ),
        },
      ]}
    />
  );
}
