import Link from "next/link";
import type { ComponentProps } from "react";
import { Badge, cn } from "./ui";

/**
 * Lume AI brand identity.
 *
 * The mark is a page with a light source rising through it: the aperture ring
 * is the "lume", the three ascending strokes are the document being read. It
 * carries the product idea — illuminating academic work — without resorting to
 * a padlock or a robot.
 */

export function LumeMark({
  className,
  ...props
}: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="presentation"
      aria-hidden
      className={cn("size-8", className)}
      {...props}
    >
      <defs>
        <linearGradient id="lume-mark-bg" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="55%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
        <radialGradient id="lume-mark-glow" cx="0.5" cy="0.62" r="0.5">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="32" height="32" rx="9" fill="url(#lume-mark-bg)" />
      <circle cx="16" cy="20" r="11" fill="url(#lume-mark-glow)" />

      {/* Aperture ring — the light */}
      <circle cx="16" cy="19.5" r="5" stroke="#fff" strokeWidth="2" opacity="0.95" />
      <circle cx="16" cy="19.5" r="1.6" fill="#fff" />

      {/* Lines of a document, ascending out of the light */}
      <path
        d="M9 11.5h14M11.5 7.5h9"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

/** Logo lock-up used in the site nav, app sidebar and footer. */
export function LumeLogo({
  href = "/",
  className,
  markClassName,
  showTagline = false,
}: {
  href?: string;
  className?: string;
  markClassName?: string;
  showTagline?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("focus-ring group flex items-center gap-2.5 rounded-lg", className)}
    >
      <LumeMark
        className={cn(
          "size-8 shrink-0 transition-transform duration-300 group-hover:scale-105",
          markClassName,
        )}
      />
      <span className="min-w-0 leading-none">
        <span className="block text-[15px] font-semibold tracking-tight">
          Lume<span className="text-brand"> AI</span>
        </span>
        {showTagline ? (
          <span className="mt-1 block text-[11px] text-muted">
            Illuminate. Analyse. Improve.
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/** Brand loading animation — a pulsing aperture. Used on route-level loaders. */
export function LumeLoader({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}
    >
      <span className="relative flex size-12 items-center justify-center text-brand">
        <span className="pulse-ring absolute inset-0 rounded-full" />
        <LumeMark className="size-10" />
      </span>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

/**
 * Honest maturity labels. Every capability shown anywhere in the product is
 * tagged with one of these so a reader can tell working software from a
 * research target that has not been measured yet.
 */
export const MATURITY = {
  IMPLEMENTED: {
    label: "Implemented",
    tone: "success" as const,
    description: "Working functionality you can use today.",
  },
  EXPERIMENTAL: {
    label: "Experimental",
    tone: "warning" as const,
    description: "Built and usable, but still being evaluated.",
  },
  PENDING: {
    label: "Evaluation pending",
    tone: "neutral" as const,
    description: "Research results have not been collected yet.",
  },
  FUTURE: {
    label: "Future work",
    tone: "neutral" as const,
    description: "Designed but not implemented in this prototype.",
  },
} as const;

export type MaturityKey = keyof typeof MATURITY;

/** Renders a maturity label. Never omit it on a research or evaluation claim. */
export function MaturityBadge({
  status,
  className,
}: {
  status: MaturityKey;
  className?: string;
}) {
  const entry = MATURITY[status];
  return (
    <Badge tone={entry.tone} className={className}>
      <span
        className="size-1.5 rounded-full bg-current"
        aria-hidden
      />
      {entry.label}
    </Badge>
  );
}
