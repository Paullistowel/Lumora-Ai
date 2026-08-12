import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { NewsletterForm } from "./newsletter";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/security", label: "Security" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    heading: "Free tools",
    links: [
      { href: "/tools/grammar", label: "Grammar checker" },
      { href: "/tools/plagiarism", label: "Plagiarism checker" },
      { href: "/tools/humanizer", label: "AI humanizer" },
      { href: "/tools", label: "All tools" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/help", label: "Help centre" },
      { href: "/integrity", label: "Integrity guide" },
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
            <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-lg">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-white">
                <ShieldCheck className="size-4" />
              </span>
              <span className="font-semibold tracking-tight">AI-AIMS</span>
            </Link>

            <p className="mt-4 max-w-xs text-sm text-muted">
              Semantic plagiarism detection, writing feedback and anonymous peer
              review — built for universities that want to teach integrity, not
              just police it.
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
            © {new Date().getFullYear()} AI-AIMS. Built as a final-year academic
            integrity platform.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-risk-original" />
              All systems operational
            </span>
            <Link href="/privacy" className="hover:text-brand">Privacy</Link>
            <Link href="/terms" className="hover:text-brand">Terms</Link>
            <Link href="/cookies" className="hover:text-brand">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
