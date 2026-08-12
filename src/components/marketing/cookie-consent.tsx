"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Cookie, Settings2, X } from "lucide-react";
import { saveConsent } from "@/app/(marketing)/actions";
import { CONSENT_COOKIE } from "@/lib/consent";
import { Button, Switch, cn } from "../ui";

/**
 * GDPR-shaped consent banner.
 *
 * "Reject all" is given the same visual weight as "Accept all" — a dark-pattern
 * banner that buries rejection is not valid consent under GDPR, and this is a
 * product sold to universities on the strength of its ethics.
 *
 * Nothing non-essential runs until a choice is recorded.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const decided = document.cookie
      .split("; ")
      .some((entry) => entry.startsWith(`${CONSENT_COOKIE}=`));
    if (decided) return;
    // Let the page paint first — a banner that beats the content on screen
    // reads as an obstacle rather than a choice.
    const timer = setTimeout(() => setVisible(true), 1100);
    return () => clearTimeout(timer);
  }, []);

  function decide(choice: { analytics: boolean; marketing: boolean }) {
    startTransition(async () => {
      await saveConsent(choice);
      setVisible(false);
    });
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-title"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-2xl sm:inset-x-6 sm:bottom-6"
        >
          <div className="surface-glass overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-lg)]">
            <div className="h-0.5 bg-gradient-to-r from-brand via-accent to-accent-2" />

            <div className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Cookie className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <h2 id="cookie-title" className="text-sm font-semibold">
                    We use a few cookies
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Essential cookies keep you signed in and are always on.
                    Analytics and marketing cookies are optional, and off until
                    you say otherwise. Read our{" "}
                    <Link href="/cookies" className="font-medium text-brand hover:underline">
                      cookie policy
                    </Link>
                    .
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => decide({ analytics: false, marketing: false })}
                  aria-label="Reject optional cookies and close"
                  className="focus-ring -mt-1 -mr-1 rounded-lg p-1.5 text-muted hover:bg-surface-muted"
                >
                  <X className="size-4" />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {showDetail ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      <div className="flex items-start gap-3 opacity-70">
                        <span className="relative mt-0.5 inline-flex shrink-0">
                          <span className="block h-5 w-9 rounded-full bg-brand" />
                          <span className="absolute top-0.5 left-0.5 size-4 translate-x-4 rounded-full bg-white" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium">
                            Strictly necessary
                          </span>
                          <span className="block text-xs text-muted">
                            Session, security and consent storage. Cannot be
                            switched off.
                          </span>
                        </span>
                      </div>

                      <Switch
                        label="Analytics"
                        description="Anonymous page and feature usage, so we know what to improve."
                        checked={analytics}
                        onChange={(event) => setAnalytics(event.target.checked)}
                      />
                      <Switch
                        label="Marketing"
                        description="Measures which campaigns bring institutions to the site."
                        checked={marketing}
                        onChange={(event) => setMarketing(event.target.checked)}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => decide({ analytics: true, marketing: true })}
                  disabled={pending}
                  className="flex-1 px-4 py-2 text-sm sm:flex-none"
                >
                  Accept all
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => decide({ analytics: false, marketing: false })}
                  disabled={pending}
                  className="flex-1 px-4 py-2 text-sm sm:flex-none"
                >
                  Reject all
                </Button>

                {showDetail ? (
                  <Button
                    variant="secondary"
                    onClick={() => decide({ analytics, marketing })}
                    disabled={pending}
                    className="flex-1 px-4 py-2 text-sm sm:flex-none"
                  >
                    Save choices
                  </Button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowDetail((v) => !v)}
                  className={cn(
                    "focus-ring ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground",
                  )}
                >
                  <Settings2 className="size-3.5" />
                  {showDetail ? "Hide options" : "Customise"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
