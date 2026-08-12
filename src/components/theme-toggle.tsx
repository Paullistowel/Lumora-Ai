"use client";

import { Moon, Sun } from "lucide-react";

/**
 * Theme preference, persisted locally.
 *
 * The inline script in the root layout stamps `.dark` on <html> before first
 * paint. This button therefore renders no theme-dependent markup at all — both
 * icons are always in the DOM and CSS shows the right one — which keeps the
 * server and client HTML identical and needs no state or effect to stay in
 * sync with the class the script set.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("lume-theme", next ? "dark" : "light");
    } catch {
      // Private browsing or storage disabled — the toggle still works for this
      // session, it just will not be remembered.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark theme"
      className="focus-ring rounded-lg p-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}
