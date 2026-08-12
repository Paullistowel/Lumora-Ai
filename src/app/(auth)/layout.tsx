import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const HIGHLIGHTS = [
  "Reports in under two seconds, not overnight",
  "Every score comes with the paragraphs behind it",
  "Your work never leaves your institution's network",
] as const;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      {/* ── Form side ──────────────────────────────────────────────────── */}
      <div className="relative flex w-full flex-col px-4 py-6 sm:px-8 lg:w-[52%]">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="focus-ring group flex items-center gap-2 rounded-lg"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-white transition-transform group-hover:scale-105">
              <ShieldCheck className="size-4" />
            </span>
            <span className="font-semibold tracking-tight">Lume AI</span>
          </Link>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/"
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to site
            </Link>
          </div>
        </div>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {children}
        </main>

        <p className="text-center text-xs text-muted">
          <Link href="/privacy" className="hover:text-brand">Privacy</Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:text-brand">Terms</Link>
          <span className="mx-2">·</span>
          <Link href="/help" className="hover:text-brand">Help</Link>
        </p>
      </div>

      {/* ── Visual side ────────────────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden border-l border-border bg-surface lg:flex lg:w-[48%] lg:flex-col lg:justify-center">
        <div className="aurora" aria-hidden />
        <div className="grid-lines" aria-hidden />
        <div className="noise" aria-hidden />

        <div className="relative px-12 py-16">
          <h2 className="max-w-md text-3xl font-semibold tracking-tight text-balance">
            Detection that catches the rewrite, not just the copy-paste.
          </h2>
          <p className="mt-4 max-w-md text-pretty text-muted">
            Every paragraph becomes a point in semantic space. Two passages
            arguing the same thing land close together — whatever words they use.
          </p>

          <div className="perspective mt-10">
            <div
              className="float rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-lg)]"
              style={{ transform: "rotateY(-9deg) rotateX(4deg)" }}
            >
              <Image
                src="/img/hero-analysis.svg"
                alt="A similarity report showing two documents with matching paragraphs highlighted"
                width={720}
                height={560}
                priority
                className="w-full rounded-xl"
              />
            </div>
          </div>

          <ul className="mt-10 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-risk-original/15 text-risk-original">
                  <Check className="size-3" />
                </span>
                <span className="text-muted">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
