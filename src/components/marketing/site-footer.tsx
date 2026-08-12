import Link from "next/link";
import { NewsletterForm } from "./newsletter";
import { LumeLogo } from "../brand";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Platform",
    links: [
      { href: "/features", label: "Features" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/security", label: "Security" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    heading: "Research",
    links: [
      { href: "/research", label: "Research & evaluation" },
      { href: "/architecture", label: "System architecture" },
      { href: "/tools", label: "Public tools" },
      { href: "/integrity", label: "Integrity guide" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/help", label: "Help centre" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/cookies", label: "Cookies" },
      { href: "/accessibility", label: "Accessibility" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <LumeLogo showTagline />

            <p className="mt-4 max-w-xs text-sm text-muted">
              AI-powered academic integrity and peer review. Intelligent document
              analysis, semantic plagiarism detection, academic writing feedback
              and structured peer review for higher education.
            </p>
            <p className="mt-3 text-xs text-muted">
              Research Prototype · Group 4 · KNUST · 2026
            </p>

            <div className="mt-6 max-w-sm">
              <p className="mb-2 text-sm font-medium">The Integrity Brief</p>
              <NewsletterForm source="footer" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <h3 className="mb-3 text-xs font-semibold tracking-wide text-foreground uppercase">
                  {column.heading}
                </h3>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="focus-ring rounded text-sm text-muted transition-colors hover:text-brand"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Lume AI — a final-year research project.
            Not a commercial product.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <Link href="/research" className="hover:text-brand">Research</Link>
            <Link href="/privacy" className="hover:text-brand">Privacy</Link>
            <Link href="/terms" className="hover:text-brand">Terms</Link>
            <Link href="/cookies" className="hover:text-brand">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
