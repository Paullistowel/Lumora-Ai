"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown, Menu, ShieldCheck, SpellCheck, Sparkles, ScanSearch, X,
} from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { ButtonLink, cn } from "../ui";

const TOOLS = [
  {
    href: "/tools/grammar",
    label: "Grammar checker",
    description: "Live spelling, grammar and academic-style corrections",
    icon: SpellCheck,
  },
  {
    href: "/tools/plagiarism",
    label: "Plagiarism checker",
    description: "Semantic similarity against your own reference texts",
    icon: ScanSearch,
  },
  {
    href: "/tools/humanizer",
    label: "AI humanizer",
    description: "Rewrite machine-sounding prose into natural academic writing",
    icon: Sparkles,
  },
] as const;

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
] as const;

export function SiteNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setToolsOpen(false);
  }, [pathname]);

  // The drawer traps scroll; restore it whenever the drawer closes.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "surface-glass border-b border-border py-2 shadow-[var(--shadow-sm)]"
          : "border-b border-transparent py-4",
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6"
      >
        <Link href="/" className="focus-ring group flex items-center gap-2 rounded-lg">
          <span className="relative flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-white shadow-[var(--shadow-sm)] transition-transform group-hover:scale-105">
            <ShieldCheck className="size-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">AI-AIMS</span>
        </Link>

        <div className="mx-auto hidden items-center gap-0.5 lg:flex">
          {/* Tools dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setToolsOpen(true)}
            onMouseLeave={() => setToolsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setToolsOpen((v) => !v)}
              aria-expanded={toolsOpen}
              className={cn(
                "focus-ring flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/tools")
                  ? "text-brand"
                  : "text-muted hover:text-foreground",
              )}
            >
              Free tools
              <ChevronDown
                className={cn("size-3.5 transition-transform", toolsOpen && "rotate-180")}
              />
            </button>

            <AnimatePresence>
              {toolsOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-full left-1/2 w-[26rem] -translate-x-1/2 pt-2"
                >
                  <div className="overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-lg)]">
                    {TOOLS.map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="focus-ring flex gap-3 rounded-xl p-3 transition-colors hover:bg-surface-muted"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                          <tool.icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{tool.label}</span>
                          <span className="block text-xs text-muted">
                            {tool.description}
                          </span>
                        </span>
                      </Link>
                    ))}
                    <p className="px-3 pt-2 pb-1 text-xs text-muted">
                      Free, no account needed. Text never leaves your browser.
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "focus-ring relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-brand" : "text-muted hover:text-foreground",
                )}
              >
                {link.label}
                {active ? (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand"
                  />
                ) : null}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle />
          {signedIn ? (
            <ButtonLink href="/" className="hidden px-3.5 py-2 text-sm sm:inline-flex">
              Open dashboard
            </ButtonLink>
          ) : (
            <>
              <Link
                href="/login"
                className="focus-ring hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground sm:block"
              >
                Sign in
              </Link>
              <ButtonLink
                href="/register"
                variant="gradient"
                className="px-3.5 py-2 text-sm"
              >
                Get started
              </ButtonLink>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="focus-ring rounded-lg p-2 text-muted hover:bg-surface-muted lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 right-0 flex w-80 max-w-[86vw] flex-col overflow-y-auto border-l border-border bg-surface p-5"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-semibold">Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="focus-ring rounded-lg p-2 text-muted hover:bg-surface-muted"
                >
                  <X className="size-4" />
                </button>
              </div>

              <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                Free tools
              </p>
              <div className="mb-5 space-y-1">
                {TOOLS.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="flex items-center gap-3 rounded-xl p-2.5 text-sm hover:bg-surface-muted"
                  >
                    <tool.icon className="size-4 text-brand" />
                    {tool.label}
                  </Link>
                ))}
              </div>

              <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                Product
              </p>
              <div className="space-y-1">
                {LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-xl p-2.5 text-sm hover:bg-surface-muted"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-auto space-y-2 pt-6">
                <ButtonLink href="/register" variant="gradient" className="w-full">
                  Get started free
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary" className="w-full">
                  Sign in
                </ButtonLink>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
